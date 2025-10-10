import { useState, useEffect, useRef } from "react";
import { ChatArea, ChatAreaRef } from "@/components/ChatArea";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ChatItem {
  id: string;
  title: string;
  collection: string;
}

const Index = () => {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const chatAreaRef = useRef<ChatAreaRef>(null);
  const { toast } = useToast();

  // Function to create a new chat
  const createNewChat = async () => {
    const timestamp = Date.now();
    const placeholderName = `chat_${timestamp}`;
    
    try {
      const conversation = await apiClient.createConversation(
        placeholderName,
        "New Chat"
      );
      setConversationId(conversation.id);
      setSelectedCollection(placeholderName);
      
      setChats(prev => [{
        id: conversation.id,
        title: "New Chat",
        collection: placeholderName
      }, ...prev]);
      
      console.log('Created new empty chat:', conversation.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  // Fetch conversations/chats on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Load conversation when collection changes
  useEffect(() => {
    if (selectedCollection && conversationId) {
      // Conversation already loaded, just switch to it
      console.log('Switched to conversation:', conversationId);
    }
  }, [selectedCollection]);

  const fetchChats = async () => {
    try {
      // Fetch all conversations from MongoDB
      const conversations = await apiClient.listConversations();
      const chatItems: ChatItem[] = conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        collection: conv.collection
      }));
      setChats(chatItems);
      
      // Auto-create new chat if no chats exist (first time user)
      if (chatItems.length === 0) {
        await createNewChat();
      } else if (!selectedCollection) {
        // Select first chat if none selected
        const firstChat = chatItems[0];
        setSelectedCollection(firstChat.collection);
        setConversationId(firstChat.id);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const handleFileUpload = async (uploadFiles: FileList, collectionName: string) => {
    try {
      if (uploadFiles.length === 1) {
        const formData = new FormData();
        formData.append('file', uploadFiles[0]);
        formData.append('collection', collectionName);

        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
          throw new Error(errorData.detail || 'Upload failed');
        }

        const data = await response.json();
        
        // Update selectedCollection with the actual collection name from backend
        setSelectedCollection(data.collection);
        
        toast({
          title: "Upload Successful",
          description: `${data.filename} uploaded with ${data.chunks_created} chunks`,
        });
        
        // Title will be generated when user asks the first question
      } else {
        const formData = new FormData();
        Array.from(uploadFiles).forEach(file => formData.append('files', file));
        formData.append('collection', collectionName);

        const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
          throw new Error(errorData.detail || 'Upload failed');
        }

        const data = await response.json();
        
        // Update selectedCollection with the collection name used
        setSelectedCollection(collectionName);
        
        toast({
          title: "Batch Upload Complete",
          description: `${data.successful}/${data.total_files} files uploaded successfully`,
        });
        
        // Title will be generated when user asks the first question
      }

      // Refresh chats list
      await fetchChats();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewKnowledgeBase = async () => {
    await createNewChat();
  };

  const handleSelectChat = (chatId: string) => {
    console.log('Selecting chat:', chatId);
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      console.log('Found chat:', chat);
      setSelectedCollection(chat.collection);
      setConversationId(chat.id);
      console.log('Updated conversationId to:', chat.id);
    } else {
      console.error('Chat not found:', chatId);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await apiClient.updateConversationTitle(chatId, newTitle);
      
      // Update local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
      
      toast({
        title: "Chat Renamed",
        description: `Chat renamed to "${newTitle}"`,
      });
    } catch (error) {
      console.error('Error renaming chat:', error);
      toast({
        title: "Error",
        description: "Failed to rename chat",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await apiClient.deleteConversation(chatId);
      
      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // If we deleted the currently selected chat, clear the selection
      if (conversationId === chatId) {
        setConversationId(null);
        setSelectedCollection("");
      }
      
      toast({
        title: "Chat Deleted",
        description: "Chat and all messages have been deleted",
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    }
  };

  const handleShareChat = (chatId: string) => {
    // Placeholder for share functionality
    toast({
      title: "Share Feature",
      description: "Share functionality coming soon!",
    });
  };

  const handleTitleUpdate = async (chatId: string, newTitle: string) => {
    try {
      await apiClient.updateConversationTitle(chatId, newTitle);
      
      // Update local state immediately (silent update, no toast notification)
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const handleDeleteAllChats = async () => {
    try {
      const result = await apiClient.deleteAllConversations();
      
      // Clear all chats from local state
      setChats([]);
      setConversationId(null);
      setSelectedCollection(null);
      
      toast({
        title: "All Chats Deleted",
        description: `Deleted ${result.deleted_conversations} conversations and ${result.deleted_chromadb_collections} vector collections`,
      });
    } catch (error) {
      console.error('Error deleting all chats:', error);
      toast({
        title: "Error",
        description: "Failed to delete all chats. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar 
        chats={chats}
        selectedConversationId={conversationId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewKnowledgeBase}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onShareChat={handleShareChat}
        onDeleteAllChats={handleDeleteAllChats}
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatArea 
          ref={chatAreaRef}
          selectedCollection={selectedCollection}
          conversationId={conversationId}
          onUploadFiles={handleFileUpload}
          onTitleUpdate={handleTitleUpdate}
        />
      </div>
    </div>
  );
};

export default Index;
