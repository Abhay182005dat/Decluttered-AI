import numpy as np
import pandas as pd

# Load latency data in milliseconds
latencies = pd.read_csv("pipeline_latencies.csv", header=None)[0].values

total_articles = len(latencies)
total_time_seconds = np.sum(latencies) / 1000.0

p50 = np.percentile(latencies, 50)
p95 = np.percentile(latencies, 95)
p99 = np.percentile(latencies, 99)
throughput = total_articles / total_time_seconds

print("==========================================")
print("📊 AI PIPELINE TELEMETRY RESULTS")
print("==========================================")
print(f"Total Processed Items : {total_articles}")
print(f"p50 (Median Latency)   : {p50:.2f} ms")
print(f"p95 Latency            : {p95:.2f} ms")
print(f"p99 Latency            : {p99:.2f} ms")
print(f"System Throughput      : {throughput:.2f} articles/sec")
print("==========================================")