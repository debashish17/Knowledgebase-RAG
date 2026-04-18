from openai import OpenAI
from typing import List, Union, Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using NVIDIA NIM API only."""
    
    def __init__(self, provider: str = None):
        self.provider = "nvidia"  # Force NVIDIA only
        self.nvidia_client = None
        self._load_model()
    
    def _load_model(self):
        """Load the NVIDIA embedding client."""
        try:
            api_key = settings.NVIDIA_EMBEDDINGS_API_KEY
            if not api_key:
                raise ValueError("NVIDIA_EMBEDDINGS_API_KEY is required for embedding service")
            
            logger.info("Initializing NVIDIA embedding client")
            self.nvidia_client = OpenAI(
                api_key=api_key,
                base_url=settings.NVIDIA_LLM_ENDPOINT
            )
            logger.info("NVIDIA embedding client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize NVIDIA embedding client: {e}")
            raise
    
    def embed_text(self, text: str, input_type: str = "query") -> List[float]:
        """Generate embedding for a single text."""
        try:
            return self._embed_nvidia([text], input_type)[0]
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    def embed_texts(self, texts: List[str], input_type: str = "passage") -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        try:
            return self._embed_nvidia(texts, input_type)
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise
    
    def _embed_nvidia(self, texts: List[str], input_type: str = "passage") -> List[List[float]]:
        """Generate embeddings using NVIDIA API."""
        try:
            logger.debug(f"Generating NVIDIA embeddings for {len(texts)} texts")
            
            response = self.nvidia_client.embeddings.create(
                input=texts,
                model=settings.NVIDIA_EMBED_MODEL_EN,
                encoding_format="float",
                extra_body={"input_type": input_type}
            )
            
            embeddings = [data.embedding for data in response.data]
            logger.debug(f"Generated {len(embeddings)} NVIDIA embeddings")
            return embeddings
            
        except Exception as e:
            logger.error(f"NVIDIA embedding failed: {e}")
            raise
    
    def get_dimension(self) -> int:
        """Get the dimension of the embeddings."""
        return settings.nvidia_embedding_dimension
    
    def get_provider_info(self) -> dict:
        """Get information about the current embedding provider."""
        return {
            "provider": "nvidia",
            "model": settings.NVIDIA_EMBED_MODEL_EN,
            "dimension": self.get_dimension(),
            "api_available": self.nvidia_client is not None
        }


# Global embedding service instance
embedding_service = EmbeddingService()