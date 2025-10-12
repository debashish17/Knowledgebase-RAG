"""
Configuration management using Pydantic Settings.
All settings can be overridden via environment variables.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration"""
    
    # ============================================
    # Application Settings
    # ============================================
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8501,http://localhost:8080"
    
    # ============================================
    # NVIDIA API Configuration
    # ============================================
    # Embeddings API Key
    NVIDIA_EMBEDDINGS_API_KEY: Optional[str] = None
    
    # LLM API Key
    NVIDIA_LLM_API_KEY: Optional[str] = None
    
    # API Endpoint
    NVIDIA_LLM_ENDPOINT: str = "https://integrate.api.nvidia.com/v1"
    
    # Embedding Models
    NVIDIA_EMBED_MODEL_EN: str = "nvidia/nv-embedqa-e5-v5"
    NVIDIA_EMBED_MODEL_MULTI: str = "nvidia/nv-embedqa-mistral-7b-v2"
    
    # LLM Model
    NVIDIA_LLM_MODEL: str = "mistralai/mistral-7b-instruct-v0.3"
    
    # Reranker (optional)
    NVIDIA_RERANK_MODEL: Optional[str] = "nvidia/nv-rerankqa-mistral-4b-v3"
    
    # ============================================
    # ChromaDB Configuration
    # ============================================
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    CHROMA_COLLECTION_NAME: str = "knowledge_base"
    # Default to absolute path in project root to avoid relative path issues
    # When running from different directories, relative paths create multiple ChromaDB instances
    CHROMA_PERSIST_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db"))
    
    # ============================================
    # MongoDB Configuration (Optional)
    # ============================================
    MONGO_URI: Optional[str] = "mongodb://localhost:27017/"
    MONGO_DB_NAME: str = "knowledgebase"
    MONGO_COLLECTION_FILES: str = "file_metadata"
    MONGO_COLLECTION_CHAT_HISTORY: str = "chat_history"
    MONGO_COLLECTION_CONVERSATIONS: str = "conversations"
    
    # ============================================
    # Storage Configuration
    # ============================================
    MAX_UPLOAD_SIZE_MB: int = 50
    # Note: File uploads use tempfile for automatic cleanup
    # Files are processed and stored in ChromaDB, then temp files are deleted
    
    # ============================================
    # RAG Pipeline Settings
    # ============================================
    # Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # Retrieval
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.7
    USE_RERANKER: bool = False
    
    # Generation
    MAX_TOKENS: int = 1024
    TEMPERATURE: float = 0.7
    
    # ============================================
    # Ollama Configuration (Optional - Local LLM)
    # ============================================
    USE_OLLAMA: bool = False
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral"
    
    # ============================================
    # Language Detection
    # ============================================
    AUTO_DETECT_LANGUAGE: bool = True
    DEFAULT_LANGUAGE: str = "en"
    
    # ============================================
    # Embedding Configuration (NVIDIA NIM Only)
    # ============================================
    NVIDIA_EMBEDDING_DIMENSION: int = 1024
    
    class Config:
        env_file = "../.env"  # .env is in root directory, not backend/
        case_sensitive = True  # Must match environment variable names exactly
        extra = "allow"  # Allow extra fields for flexibility
    
    # Property accessors for backward compatibility
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

# Validate critical settings
if not settings.CHROMA_PERSIST_DIR or settings.CHROMA_PERSIST_DIR in ['None', 'null', '']:
    raise ValueError(
        "CHROMA_PERSIST_DIR is not properly configured! "
        f"Current value: '{settings.CHROMA_PERSIST_DIR}'. "
        "Please ensure CHROMA_PERSIST_DIR is set in your configuration."
    )

# Ensure ChromaDB directory exists
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
# os.makedirs(settings.UPLOAD_DIR, exist_ok=True)