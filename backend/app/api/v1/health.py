from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "KnowledgeForge AI API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "0.1.0",
    }
