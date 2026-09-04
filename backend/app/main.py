import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import health, auth, knowledge_bases, documents, conversations, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # ── Startup ────────────────────────────────────────────────────────────
    os.makedirs(settings.upload_dir, exist_ok=True)
    print(f"[OK] KnowledgeForge AI API starting ({settings.app_env})")

    # Initialize Qdrant collection
    try:
        from app.services.qdrant_service import qdrant_service
        await qdrant_service.ensure_collection()
    except Exception as e:
        print(f"[WARNING] Qdrant not available at startup (will retry on first use): {e}")

    # Warm up embedding model in background so startup is non-blocking
    try:
        import asyncio
        from app.services.embedding_service import embedding_service
        asyncio.create_task(asyncio.to_thread(embedding_service._get_model))
    except Exception as e:
        print(f"[WARNING] Embedding model warmup skipped: {e}")

    yield

    # ── Shutdown ───────────────────────────────────────────────────────────
    print("[INFO] KnowledgeForge AI API shutting down")


app = FastAPI(
    title="KnowledgeForge AI",
    description=(
        "Advanced RAG API — create knowledge bases, upload documents, "
        "and chat with your data using Gemini + Qdrant."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
PREFIX = settings.api_v1_prefix
app.include_router(health.router, prefix=PREFIX)
app.include_router(auth.router, prefix=PREFIX)
app.include_router(knowledge_bases.router, prefix=PREFIX)
app.include_router(documents.router, prefix=PREFIX)
app.include_router(conversations.router, prefix=PREFIX)
app.include_router(chat.router, prefix=PREFIX)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "KnowledgeForge AI API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }
