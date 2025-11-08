"""
Configuration management using Pydantic Settings.
All settings can be overridden via environment variables.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_API_URL: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    LLM_PROVIDER: str = "gemini"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8501,http://localhost:8080"

    NVIDIA_EMBEDDINGS_API_KEY: Optional[str] = None
    NVIDIA_LLM_ENDPOINT: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_EMBED_MODEL_EN: str = "nvidia/nv-embedqa-e5-v5"
    NVIDIA_EMBED_MODEL_MULTI: str = "nvidia/nv-embedqa-mistral-7b-v2"
    NVIDIA_RERANK_MODEL: Optional[str] = "nvidia/nv-rerankqa-mistral-4b-v3"

    # Chroma Cloud Configuration
    CHROMA_API_KEY: Optional[str] = None
    CHROMA_TENANT: Optional[str] = None
    CHROMA_DATABASE: Optional[str] = None
    CHROMA_COLLECTION_NAME: str = "knowledge_base"

    MONGO_URI: Optional[str] = "mongodb://localhost:27017/"
    MONGO_DB_NAME: str = "knowledgebase"
    MONGO_COLLECTION_FILES: str = "file_metadata"
    MONGO_COLLECTION_CHAT_HISTORY: str = "chat_history"
    MONGO_COLLECTION_CONVERSATIONS: str = "conversations"

    MAX_UPLOAD_SIZE_MB: int = 50

    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.7
    USE_RERANKER: bool = False
    MAX_TOKENS: int = 1024
    TEMPERATURE: float = 0.7

    AUTO_DETECT_LANGUAGE: bool = True
    DEFAULT_LANGUAGE: str = "en"
    NVIDIA_EMBEDDING_DIMENSION: int = 1024

    class Config:
        env_file = "../.env"
        case_sensitive = True
        extra = "allow"

    @property
    def nvidia_embedding_model(self) -> str:
        return self.NVIDIA_EMBED_MODEL_EN

    @property
    def nvidia_embedding_dimension(self) -> int:
        return self.NVIDIA_EMBEDDING_DIMENSION

    @property
    def nvidia_base_url(self) -> str:
        return self.NVIDIA_LLM_ENDPOINT


# Global settings instance
settings = Settings()