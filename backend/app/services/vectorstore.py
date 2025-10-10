import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
import logging
import uuid
from app.config import settings
from app.services.embeddings import embedding_service

logger = logging.getLogger(__name__)


class VectorStore:
    """Wrapper for Chroma vector database operations."""
    
    def __init__(self, collection_name: str = "knowledge_base"):
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Chroma client and collection."""
        try:
            # Validate persist directory is set correctly
            persist_dir = settings.CHROMA_PERSIST_DIR
            if not persist_dir or persist_dir in ['None', 'null', '']:
                raise ValueError(
                    f"Invalid ChromaDB persist directory: '{persist_dir}'. "
                    "Please check CHROMA_PERSIST_DIR in your configuration. "
                    "It should be set to './chroma_db' or an absolute path."
                )
            
            logger.info(f"Initializing Chroma client with persist dir: {persist_dir}")
            
            # Initialize client with persistence
            self.client = chromadb.PersistentClient(
                path=persist_dir,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            
            # Get embedding dimension from the service
            expected_dimension = embedding_service.get_dimension()
            
            # Check if collection exists and handle dimension mismatch
            try:
                existing_collection = self.client.get_collection(name=self.collection_name)
                
                # Check if collection has documents with embeddings
                sample = existing_collection.peek(limit=1)
                if sample and sample.get('embeddings') and len(sample['embeddings']) > 0:
                    existing_dimension = len(sample['embeddings'][0])
                    if existing_dimension != expected_dimension:
                        logger.warning(f"Collection '{self.collection_name}' has embedding dimension {existing_dimension}, but expected {expected_dimension}. Deleting and recreating collection.")
                        # Force delete and recreate
                        self.client.delete_collection(name=self.collection_name)
                        logger.info(f"Deleted collection '{self.collection_name}' due to dimension mismatch")
                    else:
                        logger.info(f"Collection '{self.collection_name}' exists with correct dimension {existing_dimension}")
                        self.collection = existing_collection
                        return
                else:
                    # Collection exists but is empty, check metadata for dimension
                    metadata = existing_collection.metadata
                    if metadata and metadata.get('embedding_dimension'):
                        stored_dimension = int(metadata['embedding_dimension'])
                        if stored_dimension != expected_dimension:
                            logger.warning(f"Empty collection '{self.collection_name}' has wrong dimension in metadata: {stored_dimension} vs {expected_dimension}. Recreating.")
                            self.client.delete_collection(name=self.collection_name)
                        else:
                            logger.info(f"Empty collection '{self.collection_name}' has correct dimension, reusing")
                            self.collection = existing_collection
                            return
                    else:
                        logger.info(f"Collection '{self.collection_name}' exists but has no dimension info, will recreate to be safe")
                        self.client.delete_collection(name=self.collection_name)
                        
            except Exception as e:
                # Collection doesn't exist, will create new one
                logger.info(f"Collection '{self.collection_name}' not found, will create new one: {e}")
            
            # Get or create collection with proper metadata
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={
                    "hnsw:space": "cosine",
                    "embedding_dimension": expected_dimension,
                    "embedding_provider": embedding_service.provider,
                    "embedding_model": embedding_service.get_provider_info()["model"]
                }
            )
            
            logger.info(f"Collection '{self.collection_name}' initialized successfully with dimension {expected_dimension}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Chroma client: {e}")
            raise
    
    def add_documents(self, 
                     texts: List[str], 
                     embeddings: List[List[float]], 
                     metadatas: Optional[List[Dict[str, Any]]] = None,
                     ids: Optional[List[str]] = None) -> List[str]:
        """Add documents to the vector store."""
        try:
            # Generate IDs if not provided
            if ids is None:
                ids = [str(uuid.uuid4()) for _ in texts]
            
            # Add default metadata if not provided
            if metadatas is None:
                metadatas = [{"source": "unknown"} for _ in texts]
            
            # Add to collection
            self.collection.add(
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"Added {len(texts)} documents to collection")
            return ids
            
        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise
    
    def search(self, 
               query_embedding: List[float], 
               n_results: int = 5,
               where: Optional[Dict[str, Any]] = None,
               min_similarity: float = 0.3) -> Dict[str, Any]:
        """
        Search for similar documents with quality filtering.
        
        Args:
            query_embedding: Query vector
            n_results: Number of results to return
            where: Metadata filter
            min_similarity: Minimum similarity threshold (0-1, higher = stricter)
        """
        try:
            # Retrieve more results than needed for filtering
            initial_results = n_results * 3
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=initial_results,
                where=where
            )
            
            # Filter results by similarity threshold
            if results and results.get("distances") and results["distances"][0]:
                filtered_docs = []
                filtered_metadatas = []
                filtered_distances = []
                filtered_ids = []
                
                for doc, metadata, distance, doc_id in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                    results["ids"][0]
                ):
                    # Convert distance to similarity (ChromaDB uses cosine distance: 0-2)
                    similarity = 1 - (distance / 2)
                    
                    if similarity >= min_similarity:
                        filtered_docs.append(doc)
                        filtered_metadatas.append(metadata)
                        filtered_distances.append(distance)
                        filtered_ids.append(doc_id)
                
                # Limit to requested number of results
                filtered_docs = filtered_docs[:n_results]
                filtered_metadatas = filtered_metadatas[:n_results]
                filtered_distances = filtered_distances[:n_results]
                filtered_ids = filtered_ids[:n_results]
                
                logger.info(f"Search returned {len(filtered_docs)}/{initial_results} results above {min_similarity} similarity threshold")
                
                return {
                    "documents": [filtered_docs],
                    "metadatas": [filtered_metadatas],
                    "distances": [filtered_distances],
                    "ids": [filtered_ids]
                }
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to search documents: {e}")
            raise
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection."""
        try:
            count = self.collection.count()
            return {
                "collection_name": self.collection_name,
                "document_count": count
            }
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            raise
    
    def delete_collection(self):
        """Delete the entire collection."""
        try:
            self.client.delete_collection(self.collection_name)
            logger.info(f"Deleted collection '{self.collection_name}'")
        except Exception as e:
            logger.error(f"Failed to delete collection: {e}")
            raise


# Global vector store instance
vector_store = VectorStore()