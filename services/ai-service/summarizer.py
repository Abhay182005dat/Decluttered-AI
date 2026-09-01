import os
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

# 1. Define Structured Output Schema
class NewsSummary(BaseModel):
    what_happened: str = Field(description="Concise description of the core news event.")
    why_it_happened: str = Field(description="Background context and underlying causes.")
    latest_updates: str = Field(description="Most recent developments, statements, or quotes.")
    why_it_matters: str = Field(description="Broader industry, societal, or economic impact.")

# 2. Setup JSON Output Parser
parser = JsonOutputParser(pydantic_object=NewsSummary)

# 3. Define Intelligence Prompt Template
summary_prompt = PromptTemplate(
    template="""
You are an elite news intelligence analyst for the 'Decluttered' platform.
Analyze the provided news article content and extract a structured intelligence report.

ARTICLE CONTENT:
{content}

{format_instructions}
""",
    input_variables=["content"],
    partial_variables={"format_instructions": parser.get_format_instructions()},
)

def generate_event_summary(article_text: str, groq_api_key: str) -> dict:
    """Invokes Groq LLM to generate a 4-part structured news summary."""
    llm = ChatGroq(
        groq_api_key=groq_api_key,
        model_name="openai/gpt-oss-20b",  # Active Groq model
        temperature=0.2,
    )

    chain = summary_prompt | llm | parser
    response = chain.invoke({"content": article_text})
    return response