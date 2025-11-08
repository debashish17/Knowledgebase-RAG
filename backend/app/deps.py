"""
Dependency injection for FastAPI routes.
Provides shared clients for ChromaDB, MongoDB, and other services.
"""
import logging
from typing import Optional
from functools import lru_cache

import chromadb
from chromadb.config import Settings
from pymongo import MongoClient
from pymongo.database import Database

from app.config import settings

logger = logging.getLogger(__name__)


class ChromaDBClient:
    """Singleton ChromaDB client"""
    _instance: Optional[chromadb.Client] = None
    
    @classmethod
    def get_client(cls) -> chromadb.Client:
        if cls._instance is None:
            try:
                if settings.CHROMA_HOST and settings.CHROMA_HOST != "localhost":
                    # Remote ChromaDB server
                    cls._instance = chromadb.HttpClient(
                        host=settings.CHROMA_HOST,
                        port=settings.CHROMA_PORT
                    )
                    logger.info(f"Connected to remote ChromaDB at {settings.CHROMA_HOST}:{settings.CHROMA_PORT}")
            except Exception as e:
                logger.error(f"Failed to connect to ChromaDB: {e}")
                raise
        return cls._instance


class MongoDBClient:
    """Singleton MongoDB client"""
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None
    
    @classmethod
    def get_database(cls) -> Optional[Database]:
        """Get MongoDB database instance"""
        if not settings.MONGO_URI:
            logger.warning("MongoDB URI not configured, metadata storage disabled")
            return None
            
        if cls._db is None:
            try:
                cls._client = MongoClient(settings.MONGO_URI)
                cls._db = cls._client[settings.MONGO_DB_NAME]
                # Test connection
                cls._client.admin.command('ping')
                logger.info(f"Connected to MongoDB: {settings.MONGO_DB_NAME}")
            except Exception as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                return None
        return cls._db
    
    @classmethod
    def close(cls):
        """Close MongoDB connection"""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None


# Dependency functions for FastAPI
def get_chroma_client() -> chromadb.Client:
    """Get ChromaDB client for dependency injection"""
    # ChromaDB local storage logic removed. Use cloud client from vectorstore.py if needed.
    return chromadb.HttpClient(
        host=settings.CHROMA_HOST,
        port=settings.CHROMA_PORT
    )


def get_mongo_db() -> Optional[Database]:
    """Get MongoDB database for dependency injection"""
    return MongoDBClient.get_database()


# Cleanup on shutdown
def cleanup_connections():
    """Cleanup database connections on shutdown"""
    MongoDBClient.close()
    logger.info("Closed all database connections")
