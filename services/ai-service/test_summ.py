import os
from summarizer import generate_event_summary

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

sample_text = """
Sony Music and Warner Music have filed lawsuits against AI developer Anthropic, 
alleging systemic copyright infringement. The record labels claim Anthropic scraped 
copyrighted lyrics without authorization to train its Claude models. Anthropic argues 
fair use standards apply to generative AI context window training.
"""

summary = generate_event_summary(sample_text, GROQ_API_KEY)
print("\n--- GENERATED NEWS INTELLIGENCE SUMMARY ---")
for key, val in summary.items():
    print(f"\n[{key.upper().replace('_', ' ')}]:\n{val}")