// API types and interfaces
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  confidence?: string;
  contexts?: ContextInfo[];
}

export interface ContextInfo {
  rank: number;
  document: string;
  metadata: {
    source: string;
    page?: number;
    chunk_id?: number;
  };
  similarity: number;
  distance: number;
}

export interface Collection {
  name: string;
  count?: number;
}

export interface UploadResponse {
  message: string;
  filename: string;
  collection: string;
  chunks_created: number;
}

export interface MultiUploadResponse {
  message: string;
  total_files: number;
  successful: number;
  failed: number;
  results: Array<{
    filename: string;
    status: 'success' | 'failed';
    message?: string;
    chunks_created?: number;
    error?: string;
  }>;
}

export interface AskRequest {
  question: string;
  collection: string;
  n_results?: number;
  conversation_id?: string;
}

export interface AskResponse {
  question: string;
  answer: string;
  confidence: string;
  contexts: ContextInfo[];
  total_contexts: number;
}

export interface Conversation {
  id: string;
  title: string;
  collection: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  collection: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

// API Client class
class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  async getCollections(): Promise<{ collections: string[] }> {
    const response = await fetch(`${this.baseUrl}/collections`);
    if (!response.ok) throw new Error('Failed to fetch collections');
    return response.json();
  }

  async uploadFile(file: File, collection: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', collection);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  async uploadMultipleFiles(files: File[], collection: string): Promise<MultiUploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('collection', collection);

    const response = await fetch(`${this.baseUrl}/upload/multiple`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Multiple upload failed');
    }

    return response.json();
  }

  async askQuestion(request: AskRequest): Promise<AskResponse> {
    const response = await fetch(`${this.baseUrl}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Question failed');
    }

    return response.json();
  }

  // Conversation management
  async createConversation(collection: string, title?: string): Promise<Conversation> {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, title: title || 'New Conversation' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create conversation');
    }

    return response.json();
  }

  async listConversations(collection?: string): Promise<Conversation[]> {
    const url = collection 
      ? `${this.baseUrl}/conversations?collection=${collection}`
      : `${this.baseUrl}/conversations`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`);
    if (!response.ok) throw new Error('Failed to fetch conversation');
    return response.json();
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/title`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) throw new Error('Failed to update conversation title');
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete conversation');
  }

  async deleteAllConversations(): Promise<{
    message: string;
    deleted_conversations: number;
    deleted_chromadb_collections: number;
    failed_chromadb_collections: number;
    collections_deleted: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete all conversations');
    return response.json();
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  }

  async clearConversationMessages(conversationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to clear messages');
  }
}

export const apiClient = new APIClient();