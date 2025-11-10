<div align="center">

# 📚 AI Study Buddy

### 🤖 Chat, Study, Quiz & Organize with AI

*Transform your documents into an interactive study companion powered by advanced RAG technology*

[![GitHub stars](https://img.shields.io/github/stars/yourusername/knowledgebase-rag?style=for-the-badge&logo=github&color=ff6b35)](https://github.com/yourusername/knowledgebase-rag/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-green?style=for-the-badge&logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

[🚀 Try Live Demo](https://your-deployed-website.com) • [🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [💬 Community](#-community)

</div>

---

## 🌐 Live Demo

<div align="center">

**[🚀 Try AI Study Buddy Now](https://your-deployed-website.com)**

Experience the power of AI-driven study and document conversations. Upload your documents, take interactive quizzes, track your progress, and organize your study tasks—all in one place!

</div>

## 🎯 What is AI Study Buddy?

AI Study Buddy is an **advanced, all-in-one AI-powered study assistant** that transforms how you interact with your learning materials. Whether you're a student, researcher, educator, or professional, AI Study Buddy uses Retrieval-Augmented Generation (RAG) to enable natural conversations with your documents, generate intelligent summaries, create interactive quizzes, and seamlessly track your study progress.

Upload PDFs or DOCX files, ask questions, get contextual answers, generate MCQ quizzes with instant feedback, receive curated study links, and automatically log your achievements to your calendar—all in one unified platform!

Built with a modern React 18 + TypeScript frontend and FastAPI backend. ✨

## 🌟 Key Features

<table>
<tr>
<td width="50%">

### 💬 **Conversational Document Chat**
- Natural, context-aware conversations with your documents
- Ask questions and clarify concepts instantly
- AI-generated answers tailored to your study needs

### 📝 **Smart Summarization**
- Generate concise summaries of entire knowledge base
- Summarize specific documents
- Review and retain key information effortlessly

### 🔗 **Study Links & Resources**
- Curated, authoritative web links related to your content
- Helpful notes explaining relevance
- Perfect for further exploration and research

</td>
<td width="50%">

### 🎯 **Interactive Quizzes**
- Generate MCQ quizzes based on uploaded content
- Get instant feedback and scores
- Personalized remarks to track progress
- Reinforce learning through active practice

### 📅 **Calendar & ToDo Integration**
- Every completed quiz tracked as a task
- Organize your study schedule seamlessly
- Set reminders and monitor achievements in real time

### 💾 **Persistent Chat History**
- All conversations securely stored
- Access summaries, links, and quiz results anytime
- Build upon your learning journey

</td>
</tr>
</table>

### 🏗️ Additional Capabilities

<table>
<tr>
<td width="50%">

### 📄 **Multi-Format Support**
- **PDF Processing** with PyPDF2
- **DOCX Processing** with python-docx
- Smart text extraction & chunking

### 🧠 **Advanced AI Stack**
- **NVIDIA Embedding API** for vector generation
- **Google Gemini LLM** for answer generation
- Context-aware responses

</td>
<td width="50%">

### 💾 **Cloud-Native Storage**
- **ChromaDB Cloud** for vector embeddings
- **MongoDB Atlas** for chat history
- Scalable and persistent

### 🔍 **Semantic Search**
- Lightning-fast document retrieval
- Context-aware chunking
- Conversational memory
- Session management

</td>
</tr>
</table>

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- 🐍 **Python 3.8+** installed
- 📦 **Node.js 18+** installed
- 🔑 **API Keys** (NVIDIA, Google Gemini)
- ☁️ **Cloud Accounts** (ChromaDB Cloud, MongoDB Atlas)

### Installation

```bash
# 1️⃣ Clone the repository
git clone https://github.com/yourusername/knowledgebase-rag.git
cd knowledgebase-rag

# 2️⃣ Backend Setup
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# 3️⃣ Configure environment variables
cp .env.example .env
# Edit .env file with your API keys and connection strings

# 4️⃣ Frontend Setup
cd ../frontend
npm install

# 5️⃣ Start the development servers
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload

# Terminal 2 - Frontend (in another terminal)
cd frontend
npm run dev
```

### 🎉 Launch

- **Backend:** Open http://localhost:8000
- **Frontend:** Open http://localhost:5173

That's it! Start chatting with your documents, taking quizzes, and organizing your study schedule! 🚀

## 🔑 API & Service Setup

<details>
<summary><b>🟢 NVIDIA Embedding API</b></summary>

1. Visit [build.nvidia.com](https://build.nvidia.com/)
2. Sign up for a free account
3. Navigate to API Keys section
4. Generate your embedding API key
5. Add to `.env`: `NVIDIA_API_KEY=your_key_here`

**Used for:** Generating high-quality vector embeddings

</details>

<details>
<summary><b>🔵 Google Gemini API</b></summary>

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create or sign in to your Google account
3. Generate your Gemini API key
4. Add to `.env`: `GEMINI_API_KEY=your_key_here`

**Used for:** Natural language answer generation

</details>

<details>
<summary><b>🟣 ChromaDB Cloud</b></summary>

1. Visit [ChromaDB Cloud](https://www.trychroma.com/)
2. Sign up for an account
3. Create a new collection
4. Get your connection credentials
5. Add to `.env`: `CHROMADB_URL=your_url_here`

**Used for:** Storing and querying vector embeddings

</details>

<details>
<summary><b>🟤 MongoDB Atlas</b></summary>

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Set up database user and IP whitelist
4. Get your connection string
5. Add to `.env`: `MONGODB_URI=your_connection_string`

**Used for:** Persisting chat history, quiz results, and task tracking

</details>

## 📚 Documentation

### 🏗️ Architecture Overview

```mermaid
graph TD
    A[📄 Upload Document] --> B[📝 Parse Document]
    B --> C[✂️ Text Chunking]
    C --> D[🔢 NVIDIA Embeddings]
    D --> E[💾 ChromaDB Cloud]
    F[❓ User Query] --> G[🔍 Semantic Search]
    G --> E
    E --> H[📋 Retrieve Chunks]
    H --> I[🤖 Gemini LLM]
    I --> J[💬 Generated Answer]
    J --> K[💾 MongoDB Atlas]
    K --> L[📊 Chat History]
    M[🎯 Quiz Generation] --> I
    I --> N[📝 MCQ Quiz]
    N --> O[✅ Quiz Completion]
    O --> P[📅 Calendar Task]
```

### 🔄 How It Works

**1. Document Processing**
- Documents (PDF/DOCX) are uploaded through the React interface
- FastAPI backend receives and processes files
- PyPDF2 or python-docx extracts text content
- Text is split into semantic chunks for optimal context retrieval

**2. Embedding & Storage**
- Each chunk is converted to vectors using NVIDIA Embedding API
- Vectors are stored in ChromaDB Cloud with metadata
- Enables fast semantic similarity search for relevant information

**3. Query & Retrieval**
- User questions are submitted via React frontend
- FastAPI backend embeds questions using NVIDIA API
- Semantic search finds most relevant document chunks
- Context is passed to Gemini LLM for accurate answer generation

**4. Summarization & Study Links**
- Generate concise summaries of documents or entire knowledge base
- Receive curated web links with explanatory notes
- Enhance understanding with additional resources

**5. Interactive Quizzes**
- Generate MCQ quizzes based on your uploaded content
- Take quizzes with instant feedback and scoring
- Get personalized remarks to reinforce learning

**6. Task Management**
- Completed quizzes automatically logged as tasks
- Integrated calendar/todo system tracks study progress
- Stay organized with real-time achievement monitoring

**7. Conversation Management**
- All interactions saved to MongoDB Atlas
- Chat history maintains context across sessions
- Users can access previous conversations, summaries, and quiz results
- Real-time updates via FastAPI connections

### 🎯 Use Cases

| Use Case | Description | Perfect For |
|----------|-------------|-------------|
| 📖 **Interactive Study Companion** | Chat with textbooks, take quizzes, track progress | Students, Lifelong Learners |
| 📋 **Research Assistant** | Query research papers, get summaries & links | Researchers, Academics |
| 🏢 **Professional Development** | Analyze reports, generate study materials | Professionals, Analysts |
| 📚 **Exam Preparation** | Create quizzes, review summaries, organize study | Students, Educators |
| ⚖️ **Training & Certification** | Interactive learning with progress tracking | Corporate Training, Self-learners |

### 🔧 Technology Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) |
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) ![Uvicorn](https://img.shields.io/badge/Uvicorn-2C2D72?style=flat&logo=gunicorn&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) |
| **Document Parsing** | ![PyPDF2](https://img.shields.io/badge/PyPDF2-FF6B6B?style=flat&logo=adobe-acrobat-reader&logoColor=white) ![python-docx](https://img.shields.io/badge/python--docx-2B579A?style=flat&logo=microsoft-word&logoColor=white) |
| **AI & Embeddings** | ![NVIDIA](https://img.shields.io/badge/NVIDIA_API-76B900?style=flat&logo=nvidia&logoColor=white) ![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat&logo=google&logoColor=white) |
| **Databases** | ![ChromaDB](https://img.shields.io/badge/ChromaDB_Cloud-FF6B35?style=flat&logo=databricks&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat&logo=mongodb&logoColor=white) |

</div>

## 📁 Project Structure

```
knowledgebase-rag/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (.tsx)
│   │   ├── pages/          # Page components (Chat, Quiz, Calendar)
│   │   ├── services/       # API integration
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main application
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── main.py             # FastAPI application entry
│   ├── api/
│   │   ├── routes/         # API endpoints (chat, quiz, calendar)
│   │   └── dependencies.py # Shared dependencies
│   ├── services/
│   │   ├── document_parser.py  # PDF/DOCX parsing
│   │   ├── embeddings.py       # NVIDIA embedding integration
│   │   ├── vector_store.py     # ChromaDB operations
│   │   ├── llm.py             # Gemini LLM integration
│   │   ├── quiz_generator.py  # Quiz generation logic
│   │   ├── summarizer.py      # Summarization service
│   │   └── database.py        # MongoDB operations
│   ├── models/
│   │   └── schemas.py      # Pydantic models
│   ├── utils/
│   │   ├── chunking.py     # Text chunking utilities
│   │   └── config.py       # Configuration management
│   └── requirements.txt
│
├── .env.example
├── .gitignore
└── README.md
```

## 🤝 Contributing

We love contributions! Here's how you can help make AI Study Buddy even better:

### 🐛 Found a Bug?
Open an [issue](https://github.com/yourusername/knowledgebase-rag/issues) with detailed reproduction steps.

### 💡 Have an Idea?
We'd love to hear it! Open a [feature request](https://github.com/yourusername/knowledgebase-rag/issues/new?template=feature_request.md).

### 🔧 Want to Code?

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🌟 Community

<div align="center">

### Join our growing community of developers!

[![GitHub Discussions](https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github)](https://github.com/yourusername/knowledgebase-rag/discussions)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/knowledgebase)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/knowledgebase_ai)

</div>

## 📈 Roadmap

- [x] 💬 **Conversational Document Chat**
- [x] 📝 **Smart Summarization**
- [x] 🎯 **Interactive MCQ Quizzes**
- [x] 📅 **Calendar & ToDo Integration**
- [x] 🔗 **Study Links & Resources**
- [ ] 🔌 **Additional LLM Providers** (OpenAI, Claude, Llama)
- [ ] 📊 **Advanced Analytics Dashboard**
- [ ] 🌐 **Multi-language Support**
- [ ] 🔊 **Audio Document Processing**
- [ ] 📱 **Mobile Application**
- [ ] 🔗 **REST API Documentation** with Swagger
- [ ] 🎨 **Custom Theming**
- [ ] 👥 **Multi-user Support & Collaboration**
- [ ] 🔐 **Role-based Access Control**
- [ ] 📤 **Export Conversations & Quiz Results**
- [ ] 🏆 **Gamification & Achievements**
- [ ] 📈 **Learning Analytics & Progress Tracking**

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# NVIDIA Embedding API
NVIDIA_API_KEY=your_nvidia_api_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# ChromaDB Cloud
CHROMADB_URL=your_chromadb_cloud_url
CHROMADB_API_KEY=your_chromadb_api_key

# MongoDB Atlas
MONGODB_URI=your_mongodb_connection_string

# FastAPI Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173

# Optional Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_CHUNKS_RETURNED=5
MAX_FILE_SIZE=10485760  # 10MB
```

## 🔒 Security

- All API keys are stored securely in `.env` file
- `.env` file is git-ignored for security
- MongoDB connections use encrypted connections
- ChromaDB Cloud provides secure vector storage
- CORS configured for frontend-backend communication
- File upload size limits enforced
- Input validation with Pydantic models

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- 🧠 **NVIDIA** for providing powerful embedding APIs
- 🤖 **Google** for Gemini LLM capabilities
- 💾 **ChromaDB Team** for vector database solution
- 🍃 **MongoDB** for reliable document storage
- ⚡ **FastAPI Team** for the amazing web framework
- ⚛️ **React Team** for the frontend library
- 👥 **Open Source Community** for inspiration and tools
- 🌟 **Contributors** who help make this project better

---

<div align="center">

### ⭐ Star us on GitHub if AI Study Buddy helps you study smarter and achieve more!

**Made with ❤️ for the AI, Education, and Developer community**

[⬆️ Back to top](#-ai-study-buddy)

</div>