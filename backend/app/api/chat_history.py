"""
Chat history API endpoints for managing conversations and messages.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.services.mongodb_service import mongodb_service

router = APIRouter()


# ============================================
# Request/Response Models
# ============================================

class CreateConversationRequest(BaseModel):
    collection: str
    title: Optional[str] = "New Conversation"

class ConversationResponse(BaseModel):
    id: str
    title: str
    collection: str
    created_at: str
    updated_at: str
    message_count: int

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    collection: str
    timestamp: str
    metadata: Dict[str, Any]

class UpdateConversationTitleRequest(BaseModel):
    title: str


# ============================================
# Conversation Endpoints
# ============================================

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(request: CreateConversationRequest):
    """Create a new conversation"""
    if not mongodb_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="MongoDB is not available. Chat history cannot be saved."
        )
    
    conversation_id = mongodb_service.create_conversation(
        collection=request.collection,
        title=request.title
    )
    
    if not conversation_id:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    
    conversation = mongodb_service.get_conversation(conversation_id)
    
    return ConversationResponse(
        id=conversation["_id"],
        title=conversation["title"],
        collection=conversation["collection"],
        created_at=conversation["created_at"].isoformat(),
        updated_at=conversation["updated_at"].isoformat(),
        message_count=conversation["message_count"]
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(collection: Optional[str] = None, limit: int = 50):
    """List all conversations, optionally filtered by collection"""
    if not mongodb_service.is_connected():
        return []
    
    conversations = mongodb_service.list_conversations(collection=collection, limit=limit)
    
    return [
        ConversationResponse(
            id=conv["_id"],
            title=conv["title"],
            collection=conv["collection"],
            created_at=conv["created_at"].isoformat(),
            updated_at=conv["updated_at"].isoformat(),
            message_count=conv["message_count"]
        )
        for conv in conversations
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    if not mongodb_service.is_connected():
        raise HTTPException(status_code=503, detail="MongoDB is not available")
    
    conversation = mongodb_service.get_conversation(conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return ConversationResponse(
        id=conversation["_id"],
        title=conversation["title"],
        collection=conversation["collection"],
        created_at=conversation["created_at"].isoformat(),
        updated_at=conversation["updated_at"].isoformat(),
        message_count=conversation["message_count"]
    )


@router.patch("/conversations/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: str,
    request: UpdateConversationTitleRequest
):
    """Update conversation title"""
    if not mongodb_service.is_connected():
        raise HTTPException(status_code=503, detail="MongoDB is not available")
    
    success = mongodb_service.update_conversation_title(conversation_id, request.title)
    
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found or update failed")
    
    return {"message": "Title updated successfully"}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation and all its messages"""
    if not mongodb_service.is_connected():
        raise HTTPException(status_code=503, detail="MongoDB is not available")
    
    success = mongodb_service.delete_conversation(conversation_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found or deletion failed")
    
    return {"message": "Conversation deleted successfully"}


# ============================================
# Message Endpoints
# ============================================

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(conversation_id: str, limit: int = 100):
    """Get all messages in a conversation"""
    if not mongodb_service.is_connected():
        return []
    
    messages = mongodb_service.get_conversation_history(conversation_id, limit=limit)
    
    return [
        MessageResponse(
            id=msg["_id"],
            conversation_id=msg["conversation_id"],
            role=msg["role"],
            content=msg["content"],
            collection=msg["collection"],
            timestamp=msg["timestamp"],
            metadata=msg.get("metadata", {})
        )
        for msg in messages
    ]


@router.delete("/conversations/{conversation_id}/messages")
async def clear_conversation_messages(conversation_id: str):
    """Clear all messages in a conversation"""
    if not mongodb_service.is_connected():
        raise HTTPException(status_code=503, detail="MongoDB is not available")
    
    success = mongodb_service.clear_conversation_history(conversation_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to clear conversation history")
    
    return {"message": "Conversation history cleared successfully"}


@router.get("/messages/search", response_model=List[MessageResponse])
async def search_messages(query: str, collection: Optional[str] = None, limit: int = 50):
    """Search messages by content"""
    if not mongodb_service.is_connected():
        return []
    
    messages = mongodb_service.search_messages(query, collection=collection, limit=limit)
    
    return [
        MessageResponse(
            id=msg["_id"],
            conversation_id=msg["conversation_id"],
            role=msg["role"],
            content=msg["content"],
            collection=msg["collection"],
            timestamp=msg["timestamp"],
            metadata=msg.get("metadata", {})
        )
        for msg in messages
    ]
