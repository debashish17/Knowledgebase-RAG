import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { ChatInput, ChatInputRef } from "./ChatInput";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  confidence?: string;
  contexts?: any[];
}

interface ChatAreaProps {
  selectedCollection: string | null;
  conversationId: string | null;
  onUploadFiles?: (files: FileList, collectionName: string) => void;
  onTitleUpdate?: (conversationId: string, newTitle: string) => void;
}

export interface ChatAreaRef {
  openUploadDialog: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const ChatArea = forwardRef<ChatAreaRef, ChatAreaProps>(
  ({ selectedCollection, conversationId, onUploadFiles, onTitleUpdate }, ref) => {
    const chatInputRef = useRef<ChatInputRef>(null);
    
    // Expose method to open upload dialog
    useImperativeHandle(ref, () => ({
      openUploadDialog: () => {
        chatInputRef.current?.openUploadDialog();
      },
    }));
  const [messages, setMessages] = useState<Message[]>([
      {
        id: "welcome",
        content: "Welcome! Upload documents and start asking questions.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load conversation history when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversationHistory();
    } else {
      // Reset to welcome message if no conversation
      setMessages([{
        id: "welcome",
        content: "Welcome! Upload documents and start asking questions.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }]);
    }
  }, [conversationId]);

  const loadConversationHistory = async () => {
    if (!conversationId) return;
    
    try {
      console.log('Loading conversation history for:', conversationId);
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded conversation data:', data);
        
        // Backend returns array directly, not wrapped in { messages: [...] }
        if (Array.isArray(data) && data.length > 0) {
          // Convert MongoDB messages to Message format
          const loadedMessages: Message[] = data.map((msg: any) => ({
            id: msg.id || msg._id,
            content: msg.content,
            isUser: msg.role === 'user',
            timestamp: new Date(msg.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            confidence: msg.metadata?.confidence,
            contexts: msg.metadata?.contexts,
          }));
          
          console.log('Setting messages:', loadedMessages);
          setMessages(loadedMessages);
        } else {
          // New empty chat - show welcome message
          console.log('No messages found, showing welcome message');
          setMessages([{
            id: "welcome",
            content: "Welcome! Upload documents and start asking questions.",
            isUser: false,
            timestamp: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }]);
        }
      } else {
        console.error('Failed to load conversation history:', response.status);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    // Check if collection is selected
    if (!selectedCollection) {
      toast({
        title: "No Collection Selected",
        description: "Please select a collection first or upload some documents.",
        variant: "destructive",
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call backend API with conversation tracking
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: content,
          collection: selectedCollection,
          n_results: 5,
          conversation_id: conversationId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();

      // Check if this was the first question and a title was generated
      if (data.suggested_title && conversationId && onTitleUpdate) {
        onTitleUpdate(conversationId, data.suggested_title);
      }

      // Add bot response with confidence
      const confidenceIcon = 
        data.confidence === 'High' ? '🟢' :
        data.confidence === 'Medium' ? '🟡' : '🔴';

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        confidence: `${confidenceIcon} ${data.confidence}`,
        contexts: data.contexts,
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "Sorry, I encountered an error while processing your question. Please try again or check if the backend server is running.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-glass/50 backdrop-blur-glass border-b border-white/10"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">AI Study Buddy</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ask questions about your uploaded documents
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 md:px-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-6">
          {messages.map((message) => (
            <div key={message.id}>
              <MessageBubble
                content={message.content}
                isUser={message.isUser}
                timestamp={message.timestamp}
              />
              {message.confidence && !message.isUser && (
                <div className="flex justify-start mb-4 ml-11">
                  <Badge variant="outline" className="text-xs">
                    Confidence: {message.confidence}
                  </Badge>
                  {message.contexts && message.contexts.length > 0 && (
                    <Badge variant="outline" className="text-xs ml-2">
                      📄 {message.contexts.length} sources
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          {/* Invisible div to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <ChatInput 
        ref={chatInputRef}
        onSendMessage={handleSendMessage} 
        onUploadFiles={onUploadFiles}
        selectedCollection={selectedCollection}
      />
    </div>
  );
});

ChatArea.displayName = "ChatArea";