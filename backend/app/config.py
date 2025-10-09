
import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8501,http://localhost:8080"

    # NVIDIA API (unchanged)
    NVIDIA_EMBEDDINGS_API_KEY: Optional[str] = None
    NVIDIA_LLM_API_KEY: Optional[str] = None
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_EMBEDDING_MODEL:str = "nvidia/nv-embedqa-e5-v5"
    NVIDIA_LLM_MODEL: str = "nv-mistralai/mistral-nemo-12b-instruct"

    # ChromaDB
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    CHROMA_COLLECTION_NAME: str = "knowledge_base"
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # MongoDB
    MONGO_URI: Optional[str] = "mongodb://localhost:27017/"
    MONGO_DB_NAME: str = "knowledgebase"
    MONGO_COLLECTION_CONVERSATIONS: str = "conversations"

    # Storage
    UPLOAD_DIR: str = "./uploads/knowledge_base"
    MAX_UPLOAD_SIZE_MB: int = 50

    # RAG Pipeline
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.7
    MAX_TOKENS: int = 1024
    TEMPERATURE: float = 0.7

    class Config:
        env_file = "../.env"
        case_sensitive = True

settings = Settings()
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)