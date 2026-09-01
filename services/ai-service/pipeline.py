import os
import json
import uuid
import psycopg2
from dotenv import load_dotenv
from kafka import KafkaConsumer
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, Distance, VectorParams
from summarizer import generate_event_summary

# 1. Load Root .env
load_dotenv(dotenv_path="../../.env")

# 2. Extract Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DB_URI = os.getenv("DB_URI")

# Kafka Configs
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "127.0.0.1:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "raw-articles")
KAFKA_USER = os.getenv("KAFKA_USER")
KAFKA_PASSWORD = os.getenv("KAFKA_PASSWORD")

# Qdrant Configs
QDRANT_HOST = os.getenv("QDRANT_HOST", "127.0.0.1")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "news_articles")
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", 0.82))




# 3. Initialize Embedding Model & Vector Client
print("Loading MiniLM Embedding Model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Support both Qdrant Cloud (HTTPS + API Key) and Local Docker
if QDRANT_HOST.startswith("http://") or QDRANT_HOST.startswith("https://"):
    qdrant = QdrantClient(url=QDRANT_HOST, api_key=QDRANT_API_KEY)
else:
    qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, api_key=QDRANT_API_KEY)

# Ensure Qdrant Collection Exists
collections = [c.name for c in qdrant.get_collections().collections]
if COLLECTION_NAME not in collections:
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
    print(f"Created Qdrant Collection: {COLLECTION_NAME}")

# 4. Initialize Database Connection Once
conn = psycopg2.connect(DB_URI)

# 5. Initialize Kafka Consumer with Conditional Security (Local vs Cloud Aiven)
kafka_kwargs = {
    "bootstrap_servers": [KAFKA_BROKER],
    "auto_offset_reset": "earliest",
    "enable_auto_commit": True,
    "group_id": "ai-pipeline-group",
    "value_deserializer": lambda m: json.loads(m.decode("utf-8")),
}

# Attach SASL_SSL credentials only if KAFKA_USER is present (Aiven)
if KAFKA_USER and KAFKA_PASSWORD:
    kafka_kwargs.update({
        "security_protocol": "SASL_SSL",
        "sasl_mechanism": "PLAIN",
        "sasl_plain_username": KAFKA_USER,
        "sasl_plain_password": KAFKA_PASSWORD,
    })

consumer = KafkaConsumer(KAFKA_TOPIC, **kafka_kwargs)

print(f"\n🚀 News Intelligence Pipeline Active. Listening on {KAFKA_TOPIC}...\n")

for message in consumer:
    article = message.value
    title = article.get("title", "")
    content = article.get("content", "")
    url = article.get("source_url", "")
    source = article.get("source_name", "Unknown")

    if not url or not title:
        continue

    # Generate 384-dimensional dense vector
    vector = embedder.encode(f"{title}. {content[:300]}").tolist()

    # Query Qdrant for semantic similarity
    search_results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=1,
        score_threshold=SIMILARITY_THRESHOLD,
    )

    # Reconnect to DB if session dropped
    if conn.closed != 0:
        conn = psycopg2.connect(DB_URI)

    cur = conn.cursor()

    if search_results:
        # Link to existing event cluster
        cluster_id = search_results[0].payload.get("cluster_id")
        print(f"[CLUSTERED] Linked to cluster {cluster_id[:8]}... -> {title[:50]}")
    else:
        # Create brand-new event cluster
        cluster_id = str(uuid.uuid4())
        print(f"[NEW EVENT] Created cluster {cluster_id[:8]}... -> {title[:50]}")

        cur.execute(
            "INSERT INTO event_clusters (id, title, category) VALUES (%s, %s, %s)",
            (cluster_id, title, article.get("category", "Technology"))
        )

        # Generate 4-part AI summary via Groq LLM
        print("  └─ Calling Groq LLM for news summary...")
        try:
            summary_data = generate_event_summary(f"{title}\n\n{content}", GROQ_API_KEY)

            cur.execute(
                """INSERT INTO summaries (cluster_id, what_happened, why_it_happened, latest_updates, why_it_matters)
                   VALUES (%s, %s, %s, %s, %s)""",
                (
                    cluster_id,
                    summary_data["what_happened"],
                    summary_data["why_it_happened"],
                    summary_data["latest_updates"],
                    summary_data["why_it_matters"]
                )
            )
        except Exception as e:
            print(f"  └─ ⚠️ Failed to generate summary: {e}")

    # 1. Insert Raw Article into Postgres (skip duplicates using ON CONFLICT)
    article_id = str(uuid.uuid5(uuid.NAMESPACE_URL, url))
    cur.execute(
        """INSERT INTO articles (id, source_name, source_url, title, content, cluster_id)
        VALUES (%s, %s, %s, %s, %s, %s) 
        ON CONFLICT (source_url) DO NOTHING""",
        (article_id, source, url, title, content, cluster_id)
    )

    # 2. Recalculate the exact distinct source count from the articles table
    cur.execute(
        """UPDATE event_clusters 
        SET article_count = (SELECT COUNT(*) FROM articles WHERE cluster_id = %s)
        WHERE id = %s""",
        (cluster_id, cluster_id)
    )

    # Upsert vector into Qdrant
    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=article_id,
                vector=vector,
                payload={"cluster_id": cluster_id, "url": url}
            )
        ]
    )

    conn.commit()
    cur.close()

    print(f"  ✓ Database write complete.\n")