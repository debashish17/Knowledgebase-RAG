from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict, Any
import sys
import os
import tempfile
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.services.ingestion import ingestion_service
from app.services.embeddings import embedding_service
from app.services.vectorstore import VectorStore
from app.services.llm_client import LLMClient

router = APIRouter()

# Initialize LLM client for title generation
try:
    llm_client = LLMClient()
except Exception as e:
    print(f"⚠️  LLM client initialization failed: {e}")
    llm_client = None

class UploadResponse(BaseModel):
    message: str
    filename: str
    chunks_created: int
    collection: str
    suggested_title: str = ""  # LLM-generated title

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    collection: str = Form("knowledge_base")
) -> UploadResponse:
    """Upload and process a document file"""
    try:
        logger.info(f"Upload request received: filename={file.filename}, content_type={file.content_type}, collection={collection}")
        # Validate file type
        allowed_extensions = {'.pdf', '.txt', '.md', '.docx'}
        file_extension = Path(file.filename).suffix.lower()

        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_extension}. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Process the file
            logger.info(f"Processing document: {temp_file_path}")
            chunks = ingestion_service.process_document(temp_file_path)
            logger.info(f"Chunks created: {len(chunks) if chunks else 0}")

            if not chunks:
                raise HTTPException(status_code=400, detail="No content could be extracted from the file")

            # Generate embeddings and add metadata
            texts = [chunk["text"] for chunk in chunks]
            metadatas = []
            for chunk in chunks:
                metadata = chunk["metadata"].copy()
                metadata.update({
                    "original_filename": file.filename,
                    "upload_collection": collection
                })
                metadatas.append(metadata)

            logger.info(f"Generating embeddings for {len(texts)} chunks")
            embeddings = embedding_service.embed_texts(texts, input_type="passage")
            logger.info(f"Embeddings generated: {len(embeddings)}")
            
            # Store in vector database
            vector_store = VectorStore(collection)
            doc_ids = vector_store.add_documents(
                texts=texts,
                embeddings=embeddings,
                metadatas=metadatas
            )
            
            # Generate title from document text using Gemini
            from app.services.llm_client import LLMClient
            llm_client = LLMClient()
            # Use the first 2000 characters of the document for title generation
            document_text = "\n".join(texts)[:2000]
            suggested_title = llm_client.generate_title_from_context(document_text, file.filename)

            return UploadResponse(
                message="File uploaded and processed successfully",
                filename=file.filename,
                chunks_created=len(chunks),
                collection=collection,
                suggested_title=suggested_title
            )
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Upload failed with unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

class MultiUploadResponse(BaseModel):
    message: str
    total_files: int
    successful: int
    failed: int
    results: List[Dict[str, Any]]

@router.post("/upload/multiple", response_model=MultiUploadResponse)
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    collection: str = Form("knowledge_base")
) -> MultiUploadResponse:
    """Upload and process multiple document files"""
    try:
        allowed_extensions = {'.pdf', '.txt', '.md'}
        results = []
        successful = 0
        failed = 0
        
        for file in files:
            try:
                # Validate file type
                file_extension = Path(file.filename).suffix.lower()
                
                if file_extension not in allowed_extensions:
                    results.append({
                        "filename": file.filename,
                        "status": "failed",
                        "error": f"Unsupported file type: {file_extension}"
                    })
                    failed += 1
                    continue
                
                # Save uploaded file temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                    content = await file.read()
                    temp_file.write(content)
                    temp_file_path = temp_file.name
                
                try:
                    # Process the file
                    chunks = ingestion_service.process_document(temp_file_path)
                    
                    if not chunks:
                        results.append({
                            "filename": file.filename,
                            "status": "failed",
                            "error": "No content could be extracted"
                        })
                        failed += 1
                        continue
                    
                    # Generate embeddings and add metadata
                    texts = [chunk["text"] for chunk in chunks]
                    metadatas = []
                    for chunk in chunks:
                        metadata = chunk["metadata"].copy()
                        metadata.update({
                            "original_filename": file.filename,
                            "upload_collection": collection
                        })
                        metadatas.append(metadata)
                    
                    embeddings = embedding_service.embed_texts(texts, input_type="passage")
                    
                    # Store in vector database
                    vector_store = VectorStore(collection)
                    doc_ids = vector_store.add_documents(
                        texts=texts,
                        embeddings=embeddings,
                        metadatas=metadatas
                    )
                    
                    # Don't generate title on upload - will be generated on first question
                    results.append({
                        "filename": file.filename,
                        "status": "success",
                        "chunks_created": len(chunks),
                        "suggested_title": ""
                    })
                    successful += 1
                    
                finally:
                    # Clean up temporary file
                    os.unlink(temp_file_path)
                    
            except Exception as e:
                results.append({
                    "filename": file.filename,
                    "status": "failed",
                    "error": str(e)
                })
                failed += 1
        
        return MultiUploadResponse(
            message=f"Processed {len(files)} files: {successful} successful, {failed} failed",
            total_files=len(files),
            successful=successful,
            failed=failed,
            results=results
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")

@router.get("/collections")
async def list_collections() -> Dict[str, Any]:
    """List all available collections from Chroma Cloud"""
    try:
        from app.services.vectorstore import get_chroma_client
        client = get_chroma_client()
        collections = client.list_collections()
        collection_names = [col.name for col in collections]
        return {
            "collections": collection_names if collection_names else ["knowledge_base"],
            "message": f"Found {len(collection_names)} collection(s)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list collections: {str(e)}")