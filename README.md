# 🚀 Knowledgebase-RAG

A full-stack Retrieval-Augmented Generation (RAG) application that enables intelligent document processing and conversational Q&A using NVIDIA NIM APIs, ChromaDB, and MongoDB.

## 🎯 Overview

Knowledgebase-RAG combines vector search, embeddings, and large language models to create an intelligent document Q&A system. Upload documents, ask questions, and get context-aware answers powered by AI.

**Key Features:**
- 📄 **Document Upload & Processing** - Support for PDF, DOCX, TXT, and MD files
- 🔍 **Semantic Search** - Vector-based search using ChromaDB embeddings
- 💬 **AI-Powered Q&A** - Context-aware answers using NVIDIA NIM LLM APIs
- 🗄️ **Conversation History** - MongoDB storage for persistent chat sessions
- 🎨 **Modern React UI** - Clean, responsive interface built with Vite + shadcn/ui
- 🐳 **Docker Ready** - Full containerization with Docker Compose

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.9+)
- **Vector Database:** ChromaDB (embedded mode)
- **Database:** MongoDB (conversation storage)
- **LLM API:** NVIDIA NIM (mistralai/mistral-7b-instruct)
- **Embeddings:** NVIDIA NIM Embeddings (nv-embedqa-e5-v5)
- **Document Processing:** PyPDF2, python-docx, langchain

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **State Management:** React Query (TanStack Query)

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Development:** Hot reload for both backend and frontend

## 📋 Prerequisites

### Required
- **NVIDIA NIM API Keys** - Get from [NVIDIA Build](https://build.nvidia.com/)
  - Embeddings API key
  - LLM API key

### For Docker Setup (Recommended)
- Docker Desktop (version 20.10+)
- Docker Compose (version 2.0+)

### For Local Development
- Python 3.9 or higher
- Node.js 16+ with npm
- MongoDB 7.0+ (running locally or via Docker)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/debashish17/Knowledgebase-RAG.git
cd Knowledgebase-RAG

# 2. Configure environment
cp .env.example .env
# Edit .env and add your NVIDIA API keys

# 3. Start all services
docker-compose up -d

# 4. View logs (optional)
docker-compose logs -f
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- MongoDB: localhost:27017

### Option 2: Local Development

#### Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r ..\requirements.txt

# Configure environment
cp ..\.env.example ..\.env
# Edit .env with your NVIDIA API keys

# Start MongoDB (if not using Docker)
# Option A: Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Option B: Using local MongoDB
# Start MongoDB service from Services or run mongod

# Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000

#### Frontend Setup

```powershell
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: http://localhost:5173

## 📁 Project Structure

```
Knowledgebase-RAG/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API Endpoints
│   │   │   ├── ask.py         # Q&A with RAG
│   │   │   ├── chat_history.py # Conversation management
│   │   │   ├── health.py      # Health checks
│   │   │   └── upload.py      # Document upload
│   │   ├── models/
│   │   │   └── schemas.py     # Pydantic models
│   │   ├── services/
│   │   │   ├── embeddings.py  # NVIDIA embeddings
│   │   │   ├── ingestion.py   # Document processing
│   │   │   ├── llm_client.py  # NVIDIA LLM client
│   │   │   ├── mongodb_service.py # MongoDB operations
│   │   │   └── vectorstore.py # ChromaDB operations
│   │   ├── utils/
│   │   │   ├── logging_config.py
│   │   │   └── prompt_builder.py
│   │   ├── config.py          # Settings
│   │   ├── deps.py            # Dependencies
│   │   └── main.py            # FastAPI app
│   ├── Dockerfile
│   └── uploads/               # Uploaded documents
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # UI Components
│   │   │   ├── ChatArea.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── lib/
│   │   │   └── api.ts        # API client
│   │   ├── pages/
│   │   │   └── Index.tsx     # Main page
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile.dev
│
├── requirements.txt           # Python dependencies
├── docker-compose.yml         # Docker orchestration
├── .env.example              # Environment template
├── LICENSE                   # MIT License
└── README.md                 # This file
```

## 📚 Features & Usage

### 1. Document Upload
Upload documents through the web interface or API. Supported formats: PDF, DOCX, TXT, MD.

```bash
POST /api/upload/
Content-Type: multipart/form-data

file: <file>
collection_name: "my_documents"
```

### 2. Ask Questions (RAG)
Ask questions and get AI-generated answers based on your documents.

```bash
POST /api/ask/
Content-Type: application/json

{
  "question": "What are the main findings?",
  "collection": "knowledge_base",
  "n_results": 5
}
```

**Response:**
```json
{
  "question": "What are the main findings?",
  "answer": "Based on the documents...",
  "contexts": [...],
  "total_contexts": 5
}
```

### 3. Conversation History
All conversations are automatically saved to MongoDB.

```bash
# List all conversations
GET /api/chat-history/conversations/

# Get specific conversation
GET /api/chat-history/conversations/{conversation_id}

# Delete conversation
DELETE /api/chat-history/conversations/{conversation_id}
```

### 4. Health Check
```bash
GET /health
```

## 🔧 Configuration

Create a `.env` file in the root directory with the following settings:

```env
# Application
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:8501,http://localhost:8080

# NVIDIA NIM API (Required)
NVIDIA_EMBEDDINGS_API_KEY=your_nvidia_embeddings_key
NVIDIA_LLM_API_KEY=your_nvidia_llm_key
NVIDIA_LLM_ENDPOINT=https://integrate.api.nvidia.com/v1
NVIDIA_EMBED_MODEL_EN=nvidia/nv-embedqa-e5-v5
NVIDIA_LLM_MODEL=mistralai/mistral-7b-instruct-v0.3

# ChromaDB (Embedded Mode)
CHROMA_PERSIST_DIR=./chroma_db
CHROMA_HOST=localhost
CHROMA_PORT=8000

# MongoDB
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=knowledgebase
MONGO_COLLECTION_CONVERSATIONS=conversations

# Document Processing
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# RAG Settings
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.7
MAX_TOKENS=1024
TEMPERATURE=0.7
```

**Get your NVIDIA API keys:**
1. Visit [NVIDIA Build](https://build.nvidia.com/)
2. Sign in and create API keys for embeddings and LLM
3. Add them to your `.env` file

## 🌐 API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /` - API information

### Document Management
- `POST /api/upload/` - Upload and process documents
  - Accepts: PDF, DOCX, TXT, MD
  - Automatically chunks and creates embeddings

### Q&A with RAG
- `POST /api/ask/` - Ask questions about your documents
  - Retrieves relevant context
  - Generates AI-powered answers

### Conversation History
- `GET /api/chat-history/conversations/` - List all conversations
- `GET /api/chat-history/conversations/{id}` - Get conversation details
- `POST /api/chat-history/conversations/` - Create new conversation
- `POST /api/chat-history/conversations/{id}/messages` - Add message
- `DELETE /api/chat-history/conversations/{id}` - Delete conversation

**Interactive API Documentation:** http://localhost:8000/docs (when running)

## � Docker Deployment

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

**Services started:**
- MongoDB (port 27017)
- Backend FastAPI (port 8000)
- Frontend React (port 5173)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### NVIDIA API Issues
```
Error: NVIDIA_LLM_API_KEY not found
```
- Ensure API keys are set in `.env` file
- Verify keys are valid at [NVIDIA Build](https://build.nvidia.com/)

### MongoDB Connection Failed
```powershell
# Check if MongoDB is running
docker ps | findstr mongodb

# Start MongoDB if not running
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### Port Already in Use
```powershell
# Backend (port 8000)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Frontend (port 5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### ChromaDB Issues
```powershell
# Reset ChromaDB (delete and recreate)
Remove-Item -Recurse -Force .\chroma_db
# Restart backend - it will recreate automatically
```

### Dependencies Not Installing
```powershell
# Backend
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# Frontend
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
```

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/debashish17/Knowledgebase-RAG/issues)
- **Documentation:** Check this README and inline code comments
- **API Docs:** http://localhost:8000/docs (when running)

## 🗺️ Roadmap

Future enhancements planned:
- [ ] User authentication and multi-user support
- [ ] Document versioning and history
- [ ] Advanced metadata filtering
- [ ] Real-time collaboration
- [ ] Export conversation history
- [ ] Custom embedding models
- [ ] Multi-language document support
- [ ] Performance optimizations for large documents

## � Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [NVIDIA NIM Documentation](https://build.nvidia.com/explore/discover)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

**Built with ❤️ using FastAPI, React, ChromaDB, and NVIDIA NIM**

**Version:** 1.0.0  
**Last Updated:** October 2025