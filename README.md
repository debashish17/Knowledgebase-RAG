# 🚀 Knowledge Base RAG System

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A production-ready **Retrieval-Augmented Generation (RAG)** system for intelligent document search and question-answering using NVIDIA NIM APIs, ChromaDB vector database, and MongoDB for conversation history.

## 🎯 Overview

This system provides a complete RAG solution with:
- 📤 **Document Upload & Processing** - PDF, DOCX, TXT, and MD files
- 🧠 **Intelligent Chunking** - Automatic text segmentation with overlap
- 🔍 **Vector Search** - Semantic similarity search using ChromaDB
- 💬 **LLM Integration** - NVIDIA NIM API for answer generation
- 📊 **Conversation History** - MongoDB storage for chat sessions
- 🎨 **Modern UI** - React frontend with shadcn/ui components
- 🐳 **Docker Ready** - Full containerization support

## 🏗️ Architecture

```
Knowledgebase-RAG/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   ├── health.py      # Health checks
│   │   │   ├── upload.py      # File upload
│   │   │   ├── ingest.py      # Document ingestion
│   │   │   ├── query.py       # Search queries
│   │   │   ├── ask.py         # RAG Q&A
│   │   │   └── chat_history.py # Conversation management
│   │   ├── models/            # Pydantic models
│   │   ├── services/          # Business logic
│   │   │   ├── ingestion.py   # Document processing
│   │   │   ├── embeddings.py  # Vector embeddings
│   │   │   ├── vectorstore.py # ChromaDB interface
│   │   │   ├── llm.py         # NVIDIA NIM API
│   │   │   └── mongodb.py     # MongoDB operations
│   │   ├── scripts/           # Utility scripts
│   │   ├── utils/             # Helper functions
│   │   ├── config.py          # Configuration
│   │   ├── deps.py            # Dependencies
│   │   └── main.py            # App entry point
│   ├── Dockerfile
│   └── start.bat
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── lib/              # Utilities
│   │   └── App.tsx           # Main app
│   ├── package.json
│   └── vite.config.ts
├── frontend-streamlit/         # Alternative Streamlit UI
│   ├── streamlit_app.py
│   └── Dockerfile
├── docker-compose.yml          # Multi-container setup
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** (for React frontend)
- **Docker & Docker Compose** (optional, for containerized deployment)
- **MongoDB** (or use Docker)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/debashish17/Knowledgebase-RAG.git
   cd Knowledgebase-RAG
   ```

2. **Create environment file:**
   ```bash
   copy .env.example .env
   # Edit .env with your NVIDIA API key and other settings
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - MongoDB: localhost:27017

### Option 2: Local Development

#### Backend Setup

1. **Navigate to backend:**
   ```powershell
   cd backend
   ```

2. **Create virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r ..\requirements.txt
   ```

4. **Set up environment:**
   ```powershell
   copy .env.example .env
   # Edit .env with your configuration
   ```

5. **Start MongoDB (if local):**
   ```powershell
   # Install MongoDB or use Docker:
   docker run -d -p 27017:27017 --name mongodb mongo:7
   ```

6. **Run the backend:**
   ```powershell
   # Using the start script:
   .\start.bat
   
   # Or manually:
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend:**
   ```powershell
   cd frontend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start development server:**
   ```powershell
   npm run dev
   ```

4. **Access the UI:**
   - Open http://localhost:5173 in your browser

## 📚 Usage

### API Endpoints

The FastAPI backend provides the following endpoints:

#### Document Management
- **POST** `/api/upload/` - Upload documents (PDF, DOCX, TXT, MD)
- **POST** `/api/ingest/` - Process and embed uploaded documents
- **GET** `/api/collections/` - List available collections

#### Query & Search
- **POST** `/api/query/` - Semantic search over documents
- **POST** `/api/ask/` - Ask questions with RAG (retrieval + LLM)

#### Chat History
- **GET** `/api/chat-history/conversations/` - List all conversations
- **GET** `/api/chat-history/conversations/{id}` - Get conversation by ID
- **POST** `/api/chat-history/conversations/` - Create new conversation
- **DELETE** `/api/chat-history/conversations/{id}` - Delete conversation

#### Health & Status
- **GET** `/health` - System health check
- **GET** `/docs` - Interactive API documentation

### Using the Web Interface

1. **Upload Documents:**
   - Click "Upload" and select PDF, DOCX, TXT, or MD files
   - Documents are automatically processed and embedded

2. **Ask Questions:**
   - Type your question in the chat interface
   - The system retrieves relevant context and generates answers using NVIDIA NIM

3. **View Conversations:**
   - Access conversation history
   - Continue previous chat sessions
   - Delete old conversations

### Command Line Usage

**Process documents via script:**
```powershell
cd backend
python app\scripts\preembed.py --file document.pdf --collection my_docs
```

**Test the pipeline:**
```powershell
python app\scripts\test_pipeline.py
```

### Supported File Types
- PDF files (`.pdf`)
- Word documents (`.docx`)
- Text files (`.txt`)
- Markdown files (`.md`)

## ⚙️ Configuration

Create a `.env` file in the root directory with the following configuration:

```env
# ============================================
# Application Settings
# ============================================
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ============================================
# NVIDIA NIM API (Required for RAG)
# ============================================
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=meta/llama-3.1-405b-instruct

# ============================================
# Vector Database (ChromaDB)
# ============================================
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_PERSIST_DIR=./chroma_db
DEFAULT_COLLECTION_NAME=knowledge_base

# ============================================
# Embeddings
# ============================================
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
EMBEDDING_BATCH_SIZE=32

# ============================================
# Document Processing
# ============================================
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_FILE_SIZE=10485760  # 10MB in bytes

# ============================================
# MongoDB (Conversation History)
# ============================================
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=knowledgebase
MONGO_COLLECTION=conversations

# ============================================
# File Storage
# ============================================
UPLOAD_DIR=./uploads
ALLOWED_EXTENSIONS=pdf,docx,txt,md

# ============================================
# Query Settings
# ============================================
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.7
```

### Key Configuration Options:

- **NVIDIA_API_KEY**: Get your API key from [NVIDIA NIM](https://build.nvidia.com/)
- **CHUNK_SIZE**: Larger chunks (1000-2000) for general documents, smaller (500-800) for technical docs
- **TOP_K_RESULTS**: Number of relevant chunks to retrieve (3-10 recommended)
- **SIMILARITY_THRESHOLD**: Minimum similarity score (0.0-1.0, higher = more strict)

## 🧪 Testing

Run the test pipeline to verify everything works:

```cmd
python app\scripts\test_pipeline.py
```

This will:
1. Create a sample document
2. Process it through the ingestion pipeline
3. Generate embeddings
4. Store in ChromaDB
5. Perform a test search
6. Display results and cleanup

## ✨ Features

### Current Capabilities

✅ **Document Processing**
- Multi-format support (PDF, DOCX, TXT, MD)
- Intelligent text chunking with overlap
- Automatic metadata extraction
- Batch processing support

✅ **Vector Search**
- ChromaDB integration
- Semantic similarity search
- Multi-collection support
- Persistent storage

✅ **LLM Integration**
- NVIDIA NIM API integration
- Context-aware answer generation
- Streaming responses
- Configurable models

✅ **Conversation Management**
- MongoDB-backed chat history
- Session persistence
- Multi-turn conversations
- Conversation deletion

✅ **API & Frontend**
- FastAPI REST API
- React UI with shadcn/ui
- Alternative Streamlit interface
- Interactive API documentation
- CORS support

✅ **DevOps**
- Docker containerization
- Docker Compose orchestration
- Health checks
- Logging and monitoring

### 🎯 Roadmap

- [ ] Multi-user authentication
- [ ] Document versioning
- [ ] Advanced filtering (date, author, tags)
- [ ] Reranking models for better results
- [ ] Multi-language support
- [ ] OCR for scanned documents
- [ ] Export conversations
- [ ] Analytics dashboard
- [ ] Cost tracking for API usage
- [ ] Custom embedding models

## 🔧 Troubleshooting

### Common Issues

**Import errors / Module not found:**
```powershell
# Ensure virtual environment is activated
.\venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

**MongoDB connection failed:**
```powershell
# Start MongoDB with Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or check if MongoDB is running locally
# Windows: services.msc -> MongoDB Service
```

**ChromaDB persistence issues:**
```powershell
# Delete and recreate the database
Remove-Item -Recurse -Force .\chroma_db
# Restart the backend - it will recreate automatically
```

**CORS errors in frontend:**
- Check that `CORS_ORIGINS` in `.env` includes your frontend URL
- Default: `http://localhost:5173` for Vite dev server

**Port already in use:**
```powershell
# Backend (port 8000)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Frontend (port 5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Memory issues with large PDFs:**
- Reduce `CHUNK_SIZE` in `.env` (try 500-800)
- Process files individually instead of batch
- Increase Docker memory limit if using containers

**NVIDIA API errors:**
- Verify your API key at [NVIDIA NIM](https://build.nvidia.com/)
- Check rate limits and quotas
- Ensure `NVIDIA_MODEL` is valid

### Docker Issues

**Containers won't start:**
```bash
# Check logs
docker-compose logs -f

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Volume permission issues:**
```bash
# Windows: Ensure Docker has access to the project folder
# Settings -> Resources -> File Sharing
```

## 📝 Example Output

When you run the test pipeline, you should see:

```
🚀 Testing Knowledge Base RAG Pipeline
==================================================
📄 Created test file: C:\temp\tmpXXX.txt

1. Testing document ingestion...
   ✅ Successfully created 8 chunks

2. Testing embedding generation...
   ✅ Generated embeddings for 3 chunks
   📊 Embedding dimension: 384

3. Testing vector store operations...
   ✅ Added 8 documents to vector store

4. Testing semantic search...
   🔍 Query: 'How do I use the preembed script?'
   ✅ Found 3 relevant results
   📋 Top result (distance: 0.445):
      To use this system, simply run the preembed script with your documents:

```bash
python preembed.py --file document.pdf
```

5. Collection Statistics:
   📊 {'collection_name': 'test_collection', 'document_count': 8}

🎉 All tests passed successfully!
```

## � Testing

### Run Backend Tests
```powershell
cd backend
pytest tests/

# Test specific components
python test_mongodb.py
python test_conversation_storage.py
python app\scripts\test_pipeline.py
```

### Test API Endpoints
```powershell
# Using the interactive docs
# Navigate to http://localhost:8000/docs

# Or use curl/Invoke-RestMethod
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
```

### Test Multi-Collection Support
```powershell
python test_multi_collection.py
```

## 📁 Project Structure

```
Knowledgebase-RAG/
├── backend/                      # Python FastAPI Backend
│   ├── app/
│   │   ├── api/                 # API route handlers
│   │   ├── models/              # Pydantic data models
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Helper utilities
│   │   ├── config.py            # App configuration
│   │   ├── deps.py              # Dependency injection
│   │   └── main.py              # FastAPI app
│   ├── uploads/                 # Uploaded documents
│   ├── chroma_db/              # Vector database storage
│   └── tests/                   # Backend tests
├── frontend/                     # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities
│   │   └── App.tsx             # Main application
│   └── public/                 # Static assets
├── frontend-streamlit/          # Alternative Streamlit UI
├── docs/                        # Documentation
├── docker-compose.yml           # Docker orchestration
├── requirements.txt             # Python dependencies
└── .env                         # Environment configuration
```

## 🤝 Contributing

Contributions are welcome! This is a modular system designed for easy extension:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution:
- **Document Processing**: Add support for more file types (PPTX, HTML, etc.)
- **Embeddings**: Integrate additional embedding models
- **Search**: Implement hybrid search (keyword + semantic)
- **UI/UX**: Enhance frontend components
- **Testing**: Add more comprehensive tests
- **Documentation**: Improve guides and examples

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [ChromaDB](https://www.trychroma.com/) - Vector database
- [NVIDIA NIM](https://build.nvidia.com/) - LLM API
- [MongoDB](https://www.mongodb.com/) - Document database
- [React](https://reactjs.org/) - Frontend framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/debashish17/Knowledgebase-RAG/issues)
- Check the [documentation](./docs/)

---

**Built with ❤️ for the AI community**