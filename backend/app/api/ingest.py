"""
/ingest endpoint - Process existing uploaded files and add to vector store
"""
import logging
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel

from app.deps import get_chroma_client, get_mongo_db
from app.services.ingestion import EnhancedIngestionService, ingestion_service
from app.services.vectorstore import VectorStore
from app.services.embeddings import embedding_service
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class IngestRequest(BaseModel):
    """Request to ingest existing files"""
    file_paths: List[str] = None  # If None, ingest all files in upload directory
    force_reindex: bool = False  # Re-process already indexed files
    

class IngestResponse(BaseModel):
    """Response from ingestion"""
    status: str
    total_files: int
    processed_files: int
    failed_files: int
    details: List[Dict[str, Any]]


async def process_ingestion_task(
    file_paths: List[str],
    force_reindex: bool,
    chroma_client,
    mongo_db
):
    """Background task to process file ingestion"""
    # Use global embedding_service and create VectorStore instance
    vector_store = VectorStore()
    
    results = []
    processed = 0
    failed = 0
    
    for file_path in file_paths:
        try:
            path = Path(file_path)
            if not path.exists():
                logger.warning(f"File not found: {file_path}")
                failed += 1
                results.append({
                    "file": file_path,
                    "status": "failed",
                    "error": "File not found"
                })
                continue
            
            # Check if already indexed
            if not force_reindex and mongo_db:
                existing = mongo_db[settings.MONGO_COLLECTION_FILES].find_one(
                    {"file_path": str(path)}
                )
                if existing and existing.get("indexed"):
                    logger.info(f"Skipping already indexed file: {file_path}")
                    results.append({
                        "file": file_path,
                        "status": "skipped",
                        "reason": "already indexed"
                    })
                    continue
            
            # Extract and chunk document
            chunks = ingestion_service.process_document(file_path)
            
            if not chunks:
                logger.warning(f"No chunks extracted from: {file_path}")
                failed += 1
                results.append({
                    "file": file_path,
                    "status": "failed",
                    "error": "No content extracted"
                })
                continue
            
            # Generate embeddings
            texts = [chunk["text"] for chunk in chunks]
            metadatas = [chunk["metadata"] for chunk in chunks]
            embeddings = embedding_service.embed_texts(texts, input_type="passage")
            
            # Add to vector store
            vector_store.add_documents(
                texts=texts,
                embeddings=embeddings,
                metadatas=metadatas
            )
            
            # Update metadata in MongoDB
            if mongo_db:
                mongo_db[settings.MONGO_COLLECTION_FILES].update_one(
                    {"file_path": str(path)},
                    {
                        "$set": {
                            "indexed": True,
                            "num_chunks": len(chunks),
                            "indexed_at": datetime.utcnow()
                        }
                    },
                    upsert=True
                )
            
            processed += 1
            results.append({
                "file": file_path,
                "status": "success",
                "chunks": len(chunks)
            })
            logger.info(f"Successfully ingested: {file_path} ({len(chunks)} chunks)")
            
        except Exception as e:
            logger.error(f"Failed to ingest {file_path}: {e}")
            failed += 1
            results.append({
                "file": file_path,
                "status": "failed",
                "error": str(e)
            })
    
    logger.info(f"Ingestion complete: {processed} successful, {failed} failed")
    return processed, failed, results


@router.post("/ingest", response_model=IngestResponse)
async def ingest_files(
    request: IngestRequest,
    background_tasks: BackgroundTasks,
    chroma_client=Depends(get_chroma_client),
    mongo_db=Depends(get_mongo_db)
):
    """
    Ingest existing files into the vector database.
    
    - If file_paths is provided, ingest only those files
    - If file_paths is None, ingest all files in the upload directory
    - Use force_reindex=True to re-process already indexed files
    """
    try:
        # Determine which files to process
        if request.file_paths:
            file_paths = request.file_paths
        else:
            # Scan upload directory for all files
            upload_dir = Path(settings.UPLOAD_DIR)
            file_paths = [
                str(f) for f in upload_dir.rglob("*")
                if f.is_file() and f.suffix.lower() in ['.pdf', '.txt', '.docx', '.md']
            ]
        
        if not file_paths:
            return IngestResponse(
                status="no_files",
                total_files=0,
                processed_files=0,
                failed_files=0,
                details=[]
            )
        
        # Process ingestion synchronously for now (can be async with Celery/RQ)
        processed, failed, details = await process_ingestion_task(
            file_paths=file_paths,
            force_reindex=request.force_reindex,
            chroma_client=chroma_client,
            mongo_db=mongo_db
        )
        
        return IngestResponse(
            status="completed",
            total_files=len(file_paths),
            processed_files=processed,
            failed_files=failed,
            details=details
        )
        
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


from datetime import datetime
