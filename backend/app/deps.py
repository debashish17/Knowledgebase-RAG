
import logging
from typing import Optional
import chromadb
from chromadb.config import Settings
from pymongo import MongoClient
from pymongo.database import Database
from app.config import settings

logger = logging.getLogger(__name__)

class ChromaDBClient:
    _instance: Optional[chromadb.Client] = None
    @classmethod
    def get_client(cls) -> chromadb.Client:
        if cls._instance is None:
            if settings.CHROMA_HOST and settings.CHROMA_HOST != "localhost":
                cls._instance = chromadb.HttpClient(
                    host=settings.CHROMA_HOST,
                    port=settings.CHROMA_PORT
                )
            else:
                cls._instance = chromadb.PersistentClient(
                    path=settings.CHROMA_PERSIST_DIR,
                    settings=Settings(anonymized_telemetry=False)
                )
        return cls._instance

class MongoDBClient:
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None
    @classmethod
    def get_database(cls) -> Optional[Database]:
        if not settings.MONGO_URI:
            return None
        if cls._db is None:
            try:
                cls._client = MongoClient(settings.MONGO_URI)
                cls._db = cls._client[settings.MONGO_DB_NAME]
                cls._client.admin.command('ping')
            except Exception:
                return None
        return cls._db
    @classmethod
    def close(cls):
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None

def get_chroma_client() -> chromadb.Client:
    return ChromaDBClient.get_client()

def get_mongo_db() -> Optional[Database]:
    return MongoDBClient.get_database()

def cleanup_connections():
    MongoDBClient.close()
