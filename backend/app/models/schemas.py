from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class DocumentMetadata(BaseModel):
    source: str
    filename: str
    chunk_index: int
    chunk_length: int
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    upload_collection: Optional[str] = None
    original_filename: Optional[str] = None

class SearchResult(BaseModel):
    rank: int
    document: str
    metadata: DocumentMetadata
    similarity: float
    distance: float

class QueryRequest(BaseModel):
    query: str
    collection: str = "knowledge_base"
    n_results: int = 5

class QueryResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int

class AskRequest(BaseModel):
    question: str
    collection: str = "knowledge_base"
    n_results: int = 5

class AskResponse(BaseModel):
    question: str
    answer: str
    contexts: List[SearchResult]
    total_contexts: int

class UploadResponse(BaseModel):
    message: str
    filename: str
    chunks_created: int
    collection: str

class HealthResponse(BaseModel):
    status: str
    message: str
    version: str
    timestamp: datetime = datetime.now()

class CollectionStats(BaseModel):
    collection_name: str
    document_count: int

class ErrorResponse(BaseModel):
    detail: str
    error_type: str
    timestamp: datetime = datetime.now()