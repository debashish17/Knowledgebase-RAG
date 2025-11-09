
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.llm_client import LLMClient
from app.services.vectorstore import VectorStore
from app.services.mongodb_service import mongodb_service
from bson import ObjectId

router = APIRouter()

class SummarizeRequest(BaseModel):
    collection: Optional[str] = "knowledge_base"
    conversation_id: Optional[str] = None

class SummarizeResponse(BaseModel):
    summary: str

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_knowledgebase(request: SummarizeRequest) -> SummarizeResponse:
    """Summarize the entire knowledge base collection using LLM (Gemini or other), cache summary in MongoDB, and save to chat history."""
    # Check MongoDB for cached summary for this collection
    if not mongodb_service.is_connected():
        raise HTTPException(status_code=503, detail="MongoDB is not available.")

    cached = mongodb_service.chat_history.find_one({
        "collection": request.collection,
        "role": "assistant",
        "metadata.type": "summary"
    })
    if cached and cached.get("content"):
        summary = cached["content"]
    else:
        # Retrieve all documents from the vector store
        vector_store = VectorStore(request.collection)
        all_docs = vector_store.get_all_documents()
        if not all_docs:
            raise HTTPException(status_code=404, detail="No documents found in knowledge base")
        # Concatenate all document texts (truncate if too long)
        full_text = "\n\n".join([doc.get("text", "") for doc in all_docs])[:16000]
        llm = LLMClient()
        summary = llm.summarize(full_text)
        # Save summary to MongoDB chat history
        metadata = {"type": "summary"}
        # Use provided conversation_id or create a new one
        conversation_id = request.conversation_id
        if not conversation_id:
            # Try to find an existing conversation for this collection
            conv = mongodb_service.conversations.find_one({"collection": request.collection})
            if conv:
                conversation_id = str(conv["_id"])
            else:
                conversation_id = mongodb_service.create_conversation(request.collection, title=f"Summary for {request.collection}")
        mongodb_service.save_message(
            conversation_id=conversation_id,
            role="assistant",
            content=summary,
            collection=request.collection,
            metadata=metadata
        )
    return SummarizeResponse(summary=summary)
