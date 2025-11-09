import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from typing import List, Dict, Any, Optional
import logging
import uuid
import os

from dotenv import load_dotenv
from app.services.embeddings import embedding_service

load_dotenv()
logger = logging.getLogger(__name__)


class VectorStore:
    def get_all_documents(self, limit: int = 300) -> list:
        """Retrieve all documents from the ChromaDB collection (up to limit)."""
        try:
            results = self.collection.peek(limit=limit)
            docs = []
            for doc, metadata, doc_id in zip(
                results.get("documents", []),
                results.get("metadatas", []),
                results.get("ids", [])
            ):
                docs.append({"text": doc, "metadata": metadata, "id": doc_id})
            return docs
        except Exception as e:
            logger.error(f"Failed to retrieve all documents: {e}")
            return []
    """Wrapper for Chroma Cloud vector database operations."""

    def __init__(self, collection_name: str = "knowledge_base"):
        self.collection_name = collection_name
        self.client: Optional[ClientAPI] = None
        self.collection: Optional[Collection] = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize Chroma Cloud client and collection."""
        try:
            api_key = os.getenv("CHROMA_API_KEY")
            tenant = os.getenv("CHROMA_TENANT")
            database = os.getenv("CHROMA_DATABASE")

            if not api_key or not tenant or not database:
                raise ValueError(
                    "Chroma Cloud credentials missing. Please set "
                    "CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE in your environment."
                )

            logger.info(f"Connecting to Chroma Cloud tenant: {tenant}, database: {database}")

            # Initialize Chroma Cloud client
            self.client = chromadb.CloudClient(
                api_key=api_key,
                tenant=tenant,
                database=database
            )

            expected_dimension = embedding_service.get_dimension()

            try:
                existing_collection = self.client.get_collection(name=self.collection_name)

                # Try peeking to verify dimension
                sample = existing_collection.peek(limit=1)
                if sample and sample.get('embeddings') and len(sample['embeddings']) > 0:
                    existing_dimension = len(sample['embeddings'][0])
                    if existing_dimension != expected_dimension:
                        logger.warning(
                            f"Collection '{self.collection_name}' has dimension {existing_dimension}, "
                            f"expected {expected_dimension}. Recreating collection."
                        )
                        self.client.delete_collection(name=self.collection_name)
                    else:
                        self.collection = existing_collection
                        logger.info(f"Reusing existing collection '{self.collection_name}'")
                        return
                else:
                    logger.info(f"Collection '{self.collection_name}' found but empty, reusing it.")
                    self.collection = existing_collection
                    return

            except Exception as e:
                logger.info(f"Collection '{self.collection_name}' not found or invalid: {e}")

            # Create a new collection with metadata
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={
                    "hnsw:space": "cosine",
                    "embedding_dimension": expected_dimension,
                    "embedding_provider": embedding_service.provider,
                    "embedding_model": embedding_service.get_provider_info()["model"]
                }
            )

            logger.info(f"Initialized Chroma Cloud collection '{self.collection_name}' successfully.")

        except Exception as e:
            logger.error(f"Failed to initialize Chroma Cloud client: {e}")
            raise

    def add_documents(
        self,
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """Add documents to Chroma Cloud vector store."""
        try:
            if ids is None:
                ids = [str(uuid.uuid4()) for _ in texts]
            if metadatas is None:
                metadatas = [{"source": "unknown"} for _ in texts]

            self.collection.add(
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )

            logger.info(f"Added {len(texts)} documents to Chroma Cloud collection '{self.collection_name}'")
            return ids
        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise

    def search(
        self,
        query_embedding: List[float],
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
        min_similarity: float = 0.3
    ) -> Dict[str, Any]:
        """Search for similar documents from Chroma Cloud."""
        try:
            initial_results = n_results * 3
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=initial_results,
                where=where
            )

            if results and results.get("distances") and results["distances"][0]:
                filtered_docs, filtered_metadatas, filtered_distances, filtered_ids = [], [], [], []

                for doc, metadata, distance, doc_id in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                    results["ids"][0]
                ):
                    similarity = 1 - (distance / 2)
                    if similarity >= min_similarity:
                        filtered_docs.append(doc)
                        filtered_metadatas.append(metadata)
                        filtered_distances.append(distance)
                        filtered_ids.append(doc_id)

                logger.info(
                    f"Search returned {len(filtered_docs)}/{initial_results} "
                    f"results above {min_similarity} similarity threshold"
                )

                return {
                    "documents": [filtered_docs[:n_results]],
                    "metadatas": [filtered_metadatas[:n_results]],
                    "distances": [filtered_distances[:n_results]],
                    "ids": [filtered_ids[:n_results]]
                }

            return results

        except Exception as e:
            logger.error(f"Failed to search documents: {e}")
            raise

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get Chroma Cloud collection stats."""
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
        """Delete the Chroma Cloud collection."""
        try:
            self.client.delete_collection(self.collection_name)
            logger.info(f"Deleted Chroma Cloud collection '{self.collection_name}'")
        except Exception as e:
            logger.error(f"Failed to delete collection: {e}")
            raise


# Global vector store instance
vector_store = VectorStore()
