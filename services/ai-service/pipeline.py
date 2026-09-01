import json
import uuid
import os
import psycopg2
from kafka import KafkaConsumer
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct
from summarizer import generate_event_summary
from qdrant_client.http.models import Distance, VectorParams
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# 1. Configuration & Credentials
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DB_URI = os.getenv("DB_URI")

# 2. Initialize Embedder & Qdrant Client
print("Loading MiniLM Embedding Model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
qdrant = QdrantClient(host=os.getenv("QDRANT_HOST"), port=int(os.getenv("QDRANT_PORT")))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION")

collections = [c.name for c in qdrant.get_collections().collections]
if COLLECTION_NAME not in collections:
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
    print(f"Created Qdrant Collection: {COLLECTION_NAME}")

# 3. Setup Kafka Consumer
consumer = KafkaConsumer(
    os.getenv("KAFKA_TOPIC"),
    bootstrap_servers=[os.getenv("KAFKA_BROKER")],
    auto_offset_reset="earliest",  # Pick up all articles from the topic
    enable_auto_commit=True,
    group_id="ai-pipeline-group",
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
)

print("\n🚀 News Intelligence Pipeline Active. Listening for articles...\n")

for message in consumer:
    article = message.value
    title = article.get("title", "")
    content = article.get("content", "")
    url = article.get("source_url", "")
    source = article.get("source_name", "Unknown")

    # Generate 384-d vector embedding
    vector = embedder.encode(f"{title}. {content[:300]}").tolist()

    # Query Qdrant for semantic similarity (Vector Search)
    similarity_threshold = float(os.getenv("SIMILARITY_THRESHOLD", 0.82))
    search_results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=1,
        score_threshold=similarity_threshold,
    )

    conn = psycopg2.connect(DB_URI)
    cur = conn.cursor()

    if search_results:
        # Article belongs to an existing event cluster
        cluster_id = search_results[0].payload.get("cluster_id")
        print(f"[CLUSTERED] Linked to cluster {cluster_id[:8]}... -> {title[:50]}")
        
        cur.execute(
            "UPDATE event_clusters SET article_count = article_count + 1 WHERE id = %s",
            (cluster_id,)
        )
    else:
        # Article represents a brand-new news event
        cluster_id = str(uuid.uuid4())
        print(f"[NEW EVENT] Created cluster {cluster_id[:8]}... -> {title[:50]}")

        # Insert new Cluster record
        cur.execute(
            "INSERT INTO event_clusters (id, title, category) VALUES (%s, %s, %s)",
            (cluster_id, title, article.get("category", "General"))
        )

        # Generate 4-part AI Summary via Groq
        print("Calling Groq LLM for news summary...")
        try:
            summary_data = generate_event_summary(f"{title}\n\n{content}", GROQ_API_KEY)

            # Persist Summary to Postgres
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
            print(f"Failed to generate summary: {e}")

    # Insert Raw Article into Postgres
    article_id = str(uuid.uuid5(uuid.NAMESPACE_URL, url))
    cur.execute(
        """INSERT INTO articles (id, source_name, source_url, title, content, cluster_id)
           VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (source_url) DO NOTHING""",
        (article_id, source, url, title, content, cluster_id)
    )

    # Upsert Article vector to Qdrant
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
    conn.close()

    print(f"Database write complete.\n")