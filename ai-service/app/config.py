import os
from typing import Optional

try:
    from pydantic import BaseModel
    class Settings(BaseModel):
        PORT: int = int(os.getenv("PORT", "8000"))
        HOST: str = os.getenv("HOST", "0.0.0.0")

        EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "tfidf")
        EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

        LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")
        LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "http://localhost:11434")
        LLM_MODEL: str = os.getenv("LLM_MODEL", "llama3.2")
        LLM_TIMEOUT: float = float(os.getenv("LLM_TIMEOUT", "15.0"))

        DEFAULT_RESULT_LIMIT: int = int(os.getenv("DEFAULT_RESULT_LIMIT", "10"))
        SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.05"))

        DATASET_PATH: str = os.getenv("DATASET_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "sample_tweets.csv"))
        RELATIONSHIPS_PATH: str = os.getenv("RELATIONSHIPS_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "tweet_relationships.csv"))
        INSIGHTS_PATH: str = os.getenv("INSIGHTS_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "insight_examples.jsonl"))

except ImportError:
    class Settings:
        def __init__(self):
            self.PORT: int = int(os.getenv("PORT", "8000"))
            self.HOST: str = os.getenv("HOST", "0.0.0.0")
            self.EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "tfidf")
            self.EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            self.LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")
            self.LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "http://localhost:11434")
            self.LLM_MODEL: str = os.getenv("LLM_MODEL", "llama3.2")
            self.LLM_TIMEOUT: float = float(os.getenv("LLM_TIMEOUT", "15.0"))
            self.DEFAULT_RESULT_LIMIT: int = int(os.getenv("DEFAULT_RESULT_LIMIT", "10"))
            self.SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.15"))
            self.DATASET_PATH: str = os.getenv("DATASET_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "sample_tweets.csv"))
            self.RELATIONSHIPS_PATH: str = os.getenv("RELATIONSHIPS_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "tweet_relationships.csv"))
            self.INSIGHTS_PATH: str = os.getenv("INSIGHTS_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "insight_examples.jsonl"))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

settings = Settings()
