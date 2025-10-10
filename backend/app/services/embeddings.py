from sentence_transformers import SentenceTransformer
from openai import OpenAI
from typing import List, Union, Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using sentence-transformers or NVIDIA API."""
    
    def __init__(self, provider: str = None):
        self.provider = provider or settings.embedding_provider
        self.model = None
        self.nvidia_client = None
        self._load_model()
    
    def _load_model(self):
        """Load the embedding model based on the provider."""
        try:
            if self.provider == "nvidia":
                # Use NVIDIA embeddings API key
                api_key = settings.NVIDIA_EMBEDDINGS_API_KEY
                if not api_key:
                    logger.warning("NVIDIA_EMBEDDINGS_API_KEY not found, falling back to sentence-transformers")
                    self.provider = "sentence-transformers"
                else:
                    logger.info("Initializing NVIDIA embedding client")
                    self.nvidia_client = OpenAI(
                        api_key=api_key,
                        base_url=settings.nvidia_base_url
                    )
                    logger.info("NVIDIA embedding client initialized successfully")
                    return
            
            # Default to sentence-transformers
            if self.provider != "sentence-transformers":
                logger.warning(f"Unknown provider '{self.provider}', falling back to sentence-transformers")
                self.provider = "sentence-transformers"
            
            logger.info(f"Loading sentence-transformers model: {settings.embedding_model}")
            self.model = SentenceTransformer(settings.embedding_model)
            logger.info("Sentence-transformers model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    
    def embed_text(self, text: str, input_type: str = "query") -> List[float]:
        """Generate embedding for a single text."""
        try:
            if self.provider == "nvidia" and self.nvidia_client:
                return self._embed_nvidia([text], input_type)[0]
            else:
                return self._embed_sentence_transformers([text])[0]
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    def embed_texts(self, texts: List[str], input_type: str = "passage") -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        try:
            if self.provider == "nvidia" and self.nvidia_client:
                return self._embed_nvidia(texts, input_type)
            else:
                return self._embed_sentence_transformers(texts)
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise
    
    def _embed_nvidia(self, texts: List[str], input_type: str = "passage") -> List[List[float]]:
        """Generate embeddings using NVIDIA API."""
        try:
            logger.debug(f"Generating NVIDIA embeddings for {len(texts)} texts")
            
            response = self.nvidia_client.embeddings.create(
                input=texts,
                model=settings.nvidia_embedding_model,
                encoding_format="float",
                extra_body={"input_type": input_type, "truncate": "NONE"}
            )
            
            embeddings = [data.embedding for data in response.data]
            logger.debug(f"Generated {len(embeddings)} NVIDIA embeddings")
            return embeddings
            
        except Exception as e:
            logger.error(f"NVIDIA embedding failed: {e}")
            logger.info("Falling back to sentence-transformers")
            # Fallback to sentence-transformers
            return self._embed_sentence_transformers(texts)
    
    def _embed_sentence_transformers(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using sentence-transformers."""
        if not self.model:
            raise RuntimeError("Sentence-transformers model not loaded")
        
        try:
            logger.debug(f"Generating sentence-transformers embeddings for {len(texts)} texts")
            embeddings = self.model.encode(texts, convert_to_tensor=False)
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error(f"Sentence-transformers embedding failed: {e}")
            raise
    
    def get_dimension(self) -> int:
        """Get the dimension of the embeddings."""
        if self.provider == "nvidia" and self.nvidia_client:
            return settings.nvidia_embedding_dimension
        else:
            return self.model.get_sentence_embedding_dimension() if self.model else settings.embedding_dimension
    
    def get_provider_info(self) -> dict:
        """Get information about the current embedding provider."""
        return {
            "provider": self.provider,
            "model": settings.nvidia_embedding_model if self.provider == "nvidia" else settings.embedding_model,
            "dimension": self.get_dimension(),
            "api_available": self.nvidia_client is not None if self.provider == "nvidia" else True
        }


# Global embedding service instance
embedding_service = EmbeddingService()