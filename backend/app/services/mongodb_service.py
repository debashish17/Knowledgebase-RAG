"""
MongoDB service for storing chat history and conversations.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pymongo import MongoClient, DESCENDING
from bson import ObjectId
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class MongoDBService:
    """MongoDB service for chat history management"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.chat_history = None
        self.conversations = None
        self._connect()
    
    def _connect(self):
        """Connect to MongoDB"""
        try:
            if settings.MONGO_URI:
                self.client = MongoClient(settings.MONGO_URI)
                self.db = self.client[settings.MONGO_DB_NAME]
                self.chat_history = self.db[settings.MONGO_COLLECTION_CHAT_HISTORY]
                self.conversations = self.db[settings.MONGO_COLLECTION_CONVERSATIONS]
                
                # Create indexes for better query performance
                self.chat_history.create_index([("conversation_id", 1), ("timestamp", 1)])
                self.conversations.create_index([("created_at", DESCENDING)])
                self.conversations.create_index([("collection", 1)])
                
                logger.info("Connected to MongoDB successfully")
            else:
                logger.warning("MongoDB URI not configured, chat history will not be persisted")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self.client = None
    
    def is_connected(self) -> bool:
        """Check if MongoDB is connected"""
        return self.client is not None
    
    # ============================================
    # Conversation Management
    # ============================================
    
    def create_conversation(self, collection: str, title: str = "New Conversation") -> str:
        """Create a new conversation and return its ID"""
        if not self.is_connected():
            return None
        
        try:
            conversation = {
                "title": title,
                "collection": collection,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "message_count": 0
            }
            result = self.conversations.insert_one(conversation)
            logger.info(f"Created conversation: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            return None
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID"""
        if not self.is_connected():
            return None
        
        try:
            conversation = self.conversations.find_one({"_id": ObjectId(conversation_id)})
            if conversation:
                conversation["_id"] = str(conversation["_id"])
            return conversation
        except Exception as e:
            logger.error(f"Error getting conversation: {e}")
            return None
    
    def list_conversations(self, collection: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List all conversations, optionally filtered by collection"""
        if not self.is_connected():
            return []
        
        try:
            query = {"collection": collection} if collection else {}
            conversations = list(
                self.conversations
                .find(query)
                .sort("updated_at", DESCENDING)
                .limit(limit)
            )
            
            # Convert ObjectId to string
            for conv in conversations:
                conv["_id"] = str(conv["_id"])
            
            return conversations
        except Exception as e:
            logger.error(f"Error listing conversations: {e}")
            return []
    
    def update_conversation_title(self, conversation_id: str, title: str) -> bool:
        """Update conversation title"""
        if not self.is_connected():
            return False
        
        try:
            result = self.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {
                    "$set": {
                        "title": title,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating conversation title: {e}")
            return False
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation and all its messages"""
        if not self.is_connected():
            return False
        
        try:
            # Delete all messages in the conversation
            self.chat_history.delete_many({"conversation_id": conversation_id})
            
            # Delete the conversation
            result = self.conversations.delete_one({"_id": ObjectId(conversation_id)})
            
            logger.info(f"Deleted conversation: {conversation_id}")
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            return False
    
    def delete_all_conversations(self) -> bool:
        """Delete all conversations and all messages"""
        if not self.is_connected():
            return False
        
        try:
            # Delete all messages
            messages_result = self.chat_history.delete_many({})
            
            # Delete all conversations
            conversations_result = self.conversations.delete_many({})
            
            logger.info(f"Deleted all conversations: {conversations_result.deleted_count} conversations, {messages_result.deleted_count} messages")
            return True
        except Exception as e:
            logger.error(f"Error deleting all conversations: {e}")
            return False
    
    # ============================================
    # Chat History Management
    # ============================================
    
    def save_message(
        self,
        conversation_id: str,
        role: str,  # 'user' or 'assistant'
        content: str,
        collection: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """Save a chat message"""
        if not self.is_connected():
            return None
        
        try:
            message = {
                "conversation_id": conversation_id,
                "role": role,
                "content": content,
                "collection": collection,
                "timestamp": datetime.utcnow(),
                "metadata": metadata or {}
            }
            
            result = self.chat_history.insert_one(message)
            
            # Update conversation's updated_at and message_count
            self.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {
                    "$set": {"updated_at": datetime.utcnow()},
                    "$inc": {"message_count": 1}
                }
            )
            
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            return None
    
    def get_message_count(self, conversation_id: str) -> int:
        """Get the number of messages in a conversation"""
        if not self.is_connected():
            return 0
        
        try:
            count = self.chat_history.count_documents({"conversation_id": conversation_id})
            return count
        except Exception as e:
            logger.error(f"Error getting message count: {e}")
            return 0
    
    def get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get chat history for a conversation"""
        if not self.is_connected():
            return []
        
        try:
            messages = list(
                self.chat_history
                .find({"conversation_id": conversation_id})
                .sort("timestamp", 1)
                .limit(limit)
            )
            
            # Convert ObjectId to string and format timestamps
            for msg in messages:
                msg["_id"] = str(msg["_id"])
                msg["timestamp"] = msg["timestamp"].isoformat()
            
            return messages
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []
    
    def search_messages(
        self,
        query: str,
        collection: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search messages by content"""
        if not self.is_connected():
            return []
        
        try:
            search_query = {
                "$text": {"$search": query}
            }
            
            if collection:
                search_query["collection"] = collection
            
            messages = list(
                self.chat_history
                .find(search_query)
                .sort("timestamp", DESCENDING)
                .limit(limit)
            )
            
            # Convert ObjectId to string
            for msg in messages:
                msg["_id"] = str(msg["_id"])
                msg["timestamp"] = msg["timestamp"].isoformat()
            
            return messages
        except Exception as e:
            logger.error(f"Error searching messages: {e}")
            return []
    
    def clear_conversation_history(self, conversation_id: str) -> bool:
        """Clear all messages in a conversation"""
        if not self.is_connected():
            return False
        
        try:
            result = self.chat_history.delete_many({"conversation_id": conversation_id})
            
            # Reset message count
            self.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": {"message_count": 0, "updated_at": datetime.utcnow()}}
            )
            
            logger.info(f"Cleared {result.deleted_count} messages from conversation {conversation_id}")
            return True
        except Exception as e:
            logger.error(f"Error clearing conversation history: {e}")
            return False
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")


# Global MongoDB service instance
mongodb_service = MongoDBService()
