import json
import uuid
import os
from datetime import datetime
from kafka import KafkaConsumer
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# 1. Initialize Embedding Model (Runs locally, fast & lightweight)
print("Loading Embedding Model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# 2. Connect to local Qdrant Vector DB
qdrant = QdrantClient(host=os.getenv("QDRANT_HOST"), port=int(os.getenv("QDRANT_PORT")))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION")

# Create collection if it doesn't exist
collections = [c.name for c in qdrant.get_collections().collections]
if COLLECTION_NAME not in collections:
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
    print(f"Created Qdrant Collection: {COLLECTION_NAME}")

# 3. Connect to Kafka Consumer
consumer = KafkaConsumer(
    os.getenv("KAFKA_TOPIC"),
    bootstrap_servers=[os.getenv("KAFKA_BROKER")],
    auto_offset_reset="earliest",  # Pick up all 20 published articles
    enable_auto_commit=True,
    group_id="ai-cluster-group",
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
)

print("\nAI Processing Service active. Listening for articles...\n")

# Similarity threshold for deduplication/clustering (Cosine distance)
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", 0.82))

for message in consumer:
    article = message.value
    title = article.get("title", "")
    content = article.get("content", "")
    url = article.get("source_url", "")

    # Combine title & content snippet for embedding
    text_to_embed = f"{title}. {content[:300]}"
    vector = embedder.encode(text_to_embed).tolist()

    # Search Qdrant for similar existing articles (Event Detection)
    search_results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=vector,
        limit=1,
        score_threshold=SIMILARITY_THRESHOLD,
    )

    if search_results:
        cluster_id = search_results[0].payload.get("cluster_id")
        print(f"[CLUSTERED] Added to existing event group ({cluster_id[:8]}...): {title[:60]}")
    else:
        cluster_id = str(uuid.uuid4())
        print(f"[NEW EVENT] Created new cluster ({cluster_id[:8]}...): {title[:60]}")

    # Store embedding and payload in Qdrant
    point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, url))
    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "title": title,
                    "url": url,
                    "source": article.get("source_name"),
                    "cluster_id": cluster_id,
                    "published_at": article.get("published_at"),
                },
            )
        ],
    )