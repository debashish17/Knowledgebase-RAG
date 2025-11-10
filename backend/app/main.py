from dotenv import load_dotenv
load_dotenv()
"""
Main FastAPI application entry point.
Includes all API routes and service initialization.
"""
import logging
from contextlib import asynccontextmanager
import asyncio
import httpx

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.utils.logging_config import setup_logging
from app.deps import cleanup_connections

# Import API routers
from app.api import health, upload, ask, chat_history, summarize, study_links, generate_quiz

# Setup logging
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup/shutdown)"""
    # Startup
    logger.info("Starting Knowledge Base RAG API")
    logger.info(f"   Environment: {settings.ENVIRONMENT}")
    logger.info(f"   Chroma Cloud: tenant={settings.CHROMA_TENANT}, database={settings.CHROMA_DATABASE}")

    # Optional background task: if FRONTEND_URL is configured, periodically ping it
    ping_task: asyncio.Task | None = None
    if settings.FRONTEND_URL:
        async def ping_frontend_loop():
            interval = max(5, int(settings.FRONTEND_PING_INTERVAL_SECONDS))
            async with httpx.AsyncClient(timeout=10.0) as client:
                while True:
                    try:
                        await client.get(settings.FRONTEND_URL)
                    except Exception:
                        pass
                    await asyncio.sleep(interval)

        ping_task = asyncio.create_task(ping_frontend_loop())

    yield

    # Shutdown
    if ping_task:
        ping_task.cancel()
        try:
            await ping_task
        except asyncio.CancelledError:
            pass
    cleanup_connections()


# Create FastAPI application
app = FastAPI(
    title="Knowledge Base RAG API",
    description="A production-ready Retrieval-Augmented Generation system for intelligent document search and Q&A",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers

app.include_router(health.router, tags=["Health"])
app.include_router(upload.router, tags=["Upload"])
app.include_router(ask.router, tags=["Ask"])
app.include_router(chat_history.router, tags=["Chat History"])
app.include_router(summarize.router, tags=["Summarize"])
app.include_router(study_links.router, tags=["Study Links"])
app.include_router(generate_quiz.router, tags=["Quiz"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Knowledge Base RAG API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# Run with: uvicorn app.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
