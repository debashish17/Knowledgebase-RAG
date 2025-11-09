import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { Quiz } from "./Quiz";
import { useTodoContext } from "../context/TodoContext";
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
    const navigate = useNavigate();
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
  const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null);
  const { addTodo } = useTodoContext();
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
      {/* Header with Calendar button */}
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
            <Button
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-glow-primary transition-all duration-300"
              onClick={() => navigate("/calendar")}
            >
              {/* Use a calendar icon from lucide-react if available */}
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Calendar / Todo
            </Button>
          </div>
        </div>
      </motion.header>


      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 md:px-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-6">
          {messages.map((message, idx) => (
            <div
              key={message.id}
              id={message.content.startsWith("Summary:") ? `summary-msg-${idx}` : undefined}
            >
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
          {/* Study feature buttons - aligned with AI responses */}
          <div className="flex flex-col gap-4 items-start my-8 ml-11 max-w-xs">
            <button 
              className="group relative w-full px-6 py-3 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 backdrop-blur-xl border border-indigo-400/30 rounded-xl font-semibold text-base text-white shadow-lg hover:shadow-indigo-500/50 hover:shadow-2xl hover:border-indigo-400/60 transition-all duration-300 overflow-hidden"
              onClick={async () => {
                setIsLoading(true);
                try {
                  // Use the latest non-user message as the document to summarize
                  const lastDocMsg = [...messages].reverse().find(m => !m.isUser && m.id !== "welcome");
                  const docText = lastDocMsg ? lastDocMsg.content : "";
                  if (!docText) {
                    toast({ title: "No document found", description: "Upload or select a document to summarize.", variant: "destructive" });
                    setIsLoading(false);
                    return;
                  }
                  const response = await fetch(`${API_BASE_URL}/summarize`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ collection: selectedCollection || "knowledge_base" })
                  });
                  if (!response.ok) throw new Error("Failed to summarize document");
                  const data = await response.json();
                  // Only add summary if not already present in messages
                  const summaryIndex = messages.findIndex(m => m.content.startsWith("Summary:") && m.content.includes(data.summary));
                  if (summaryIndex === -1) {
                    setMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      content: `Summary:\n${data.summary}`,
                      isUser: false,
                      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                    }]);
                  } else {
                    // Scroll to the summary message using its id
                    setTimeout(() => {
                      const summaryDiv = document.getElementById(`summary-msg-${summaryIndex}`);
                      if (summaryDiv) summaryDiv.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }
                } catch (err) {
                  toast({ title: "Error", description: "Could not summarize document.", variant: "destructive" });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 to-purple-500/0 group-hover:from-indigo-400/30 group-hover:to-purple-500/30 transition-all duration-300"></div>
              <span className="relative flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Summarize Document
              </span>
            </button>

            <button 
              className="group relative w-full px-6 py-3 bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10 backdrop-blur-xl border border-fuchsia-400/30 rounded-xl font-semibold text-base text-white shadow-lg hover:shadow-fuchsia-500/50 hover:shadow-2xl hover:border-fuchsia-400/60 transition-all duration-300 overflow-hidden"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await fetch(`${API_BASE_URL}/study-links`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ collection: selectedCollection || "knowledge_base", n_links: 5 })
                  });
                  if (!response.ok) throw new Error("Failed to get study links");
                  const data = await response.json();
                  const links = data.links;
                  setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    content: `Study Links:\n${links.map((l, i) => `${i + 1}. ${l}`).join("\n")}`,
                    isUser: false,
                    timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                  }]);
                } catch (err) {
                  toast({ title: "Error", description: "Could not get study links.", variant: "destructive" });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-400/0 to-pink-500/0 group-hover:from-fuchsia-400/30 group-hover:to-pink-500/30 transition-all duration-300"></div>
              <span className="relative flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Get Study Links
              </span>
            </button>

            <button 
              className="group relative w-full px-6 py-3 bg-gradient-to-br from-purple-500/10 to-blue-600/10 backdrop-blur-xl border border-purple-400/30 rounded-xl font-semibold text-base text-white shadow-lg hover:shadow-purple-500/50 hover:shadow-2xl hover:border-purple-400/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg overflow-hidden"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ collection: selectedCollection || "knowledge_base", n_questions: 10 })
                  });
                  if (!response.ok) throw new Error("Failed to generate quiz");
                  const data = await response.json();
                  const questions = data.questions;
                  setQuizQuestions(questions);
                } catch (err) {
                  toast({ title: "Error", description: "Could not generate quiz questions.", variant: "destructive" });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-blue-500/0 group-hover:from-purple-400/30 group-hover:to-blue-500/30 transition-all duration-300"></div>
              <span className="relative flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Generate Quiz
              </span>
            </button>
          </div>
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
          {/* Render Quiz if available */}
          {quizQuestions && (
            <Quiz
              questions={quizQuestions}
              onFinish={(score, total) => {
                let remark = "";
                if (score === total) {
                  remark = "Excellent! You got all questions correct.";
                } else if (score > total * 0.7) {
                  remark = "Great job! You scored well.";
                } else if (score > total * 0.4) {
                  remark = "Good effort! Review the material for better results.";
                } else {
                  remark = "Keep practicing! Try again for a better score.";
                }
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  content: `Quiz completed. Score: ${score} / ${total}\n${remark}`,
                  isUser: false,
                  timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                }]);
                // Add completed quiz to global todo context
                addTodo({
                  title: `Completed quiz on ${selectedCollection || "Unknown topic"}`,
                  date: new Date().toISOString().slice(0, 10),
                  completed: true,
                  priority: "medium",
                  category: "Quiz"
                });
                setQuizQuestions(null);
              }}
            />
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