
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.llm_client import LLMClient
from app.services.vectorstore import VectorStore
from app.services.mongodb_service import mongodb_service

router = APIRouter()

class SummarizeRequest(BaseModel):
    collection: Optional[str] = "knowledge_base"
    conversation_id: Optional[str] = None

class SummarizeResponse(BaseModel):
    summary: str

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_knowledgebase(request: SummarizeRequest) -> SummarizeResponse:
    """Fetch all chunks from Chroma for the collection and summarize using Gemini."""

    # Step 1: Retrieve all documents from Chroma
    vector_store = VectorStore(request.collection)
    all_docs = vector_store.get_all_documents()

    if not all_docs:
        raise HTTPException(status_code=404, detail="No documents found in knowledge base")

    # Step 2: Concatenate chunk texts and send to Gemini
    full_text = "\n\n".join([doc.get("text", "") for doc in all_docs])[:16000]
    llm = LLMClient()
    summary = llm.summarize(full_text)

    # Step 3: Optionally save to MongoDB chat history
    if mongodb_service.is_connected() and request.conversation_id:
        mongodb_service.save_message(
            conversation_id=request.conversation_id,
            role="assistant",
            content=summary,
            collection=request.collection,
            metadata={"type": "summary"}
        )

    return SummarizeResponse(summary=summary)
