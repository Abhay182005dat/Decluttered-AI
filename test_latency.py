import json
import os
import time
import uuid
from kafka import KafkaProducer
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv("../../.env")

# Obtain Hosted Kafka Credentials
KAFKA_BROKER = os.Getenv("KAFKA_BROKER", "127.0.0.1:9092")
KAFKA_TOPIC = os.Getenv("KAFKA_TOPIC", "raw-articles")
KAFKA_USER = os.Getenv("KAFKA_USER", "")
KAFKA_PASSWORD = os.Getenv("KAFKA_PASSWORD", "")

def generate_mock_article(i):
    return {
        "source_name": f"Benchmark_Source_{i % 5}",
        "source_url": f"https://benchmark.local/article/{uuid.uuid4()}",
        "title": f"Benchmark Event {i}: The quick brown fox jumps over the lazy dog.",
        "content": "This is a controlled synthetic payload used specifically to measure the embedding and LLM inference latency of the pipeline under heavy load. " * 5,
        "category": "technology",
        # Inject the exact creation timestamp for end-to-end latency tracking
        "published_at": time.time()
    }

def get_kafka_producer():
    producer_args = {
        "bootstrap_servers": [KAFKA_BROKER],
        "value_serializer": lambda v: json.dumps(v).encode("utf-8")
    }

    # Dynamically attach SSL & SASL credentials if provided for cloud broker
    if KAFKA_USER and KAFKA_PASSWORD:
        producer_args.update({
            "security_protocol": "SASL_SSL",
            "sasl_mechanism": "PLAIN",
            "sasl_plain_username": KAFKA_USER,
            "sasl_plain_password": KAFKA_PASSWORD
        })

    return KafkaProducer(**producer_args)

def run_throughput_test(total_messages=500):
    producer = get_kafka_producer()

    print(f"🚀 Injecting {total_messages} synthetic articles into cloud topic [{KAFKA_TOPIC}] @ {KAFKA_BROKER}...")

    start_time = time.time()

    for i in range(total_messages):
        article = generate_mock_article(i)
        producer.send(KAFKA_TOPIC, article)

    producer.flush()
    end_time = time.time()

    duration = end_time - start_time
    throughput = total_messages / duration

    print(f"✅ Injection Complete.")
    print(f"⏱️ Total Injection Time: {duration:.2f} seconds")
    print(f"📊 Kafka Ingestion Throughput: {throughput:.2f} messages/sec")

if __name__ == "__main__":
    run_throughput_test(500)