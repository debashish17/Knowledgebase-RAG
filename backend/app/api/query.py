from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.services.embeddings import embedding_service
from app.services.vectorstore import VectorStore

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    collection: str = "knowledge_base"
    n_results: int = 5

class QueryResponse(BaseModel):
    query: str
    results: List[Dict[str, Any]]
    total_results: int

@router.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest) -> QueryResponse:
    """Search for relevant documents using semantic similarity"""
    try:
        # Generate embedding for the query
        query_embedding = embedding_service.embed_text(request.query, input_type="query")
        
        # Search the vector store
        vector_store = VectorStore(request.collection)
        results = vector_store.search(
            query_embedding=query_embedding,
            n_results=request.n_results
        )
        
        # Format results
        formatted_results = []
        documents = results.get('documents', [[]])[0]
        metadatas = results.get('metadatas', [[]])[0]
        distances = results.get('distances', [[]])[0]
        
        for i, (doc, metadata, distance) in enumerate(zip(documents, metadatas, distances)):
            formatted_results.append({
                "rank": i + 1,
                "document": doc,
                "metadata": metadata,
                "similarity": 1 - distance,
                "distance": distance
            })
        
        return QueryResponse(
            query=request.query,
            results=formatted_results,
            total_results=len(formatted_results)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@router.get("/collections/{collection_name}/stats")
async def get_collection_stats(collection_name: str) -> Dict[str, Any]:
    """Get statistics for a collection"""
    try:
        vector_store = VectorStore(collection_name)
        stats = vector_store.get_collection_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")