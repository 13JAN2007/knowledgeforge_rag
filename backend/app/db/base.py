"""
Import all models here so Alembic can discover them for migrations.
"""
from app.db.session import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.knowledge_base import KnowledgeBase  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.document_chunk import DocumentChunk  # noqa: F401
from app.models.conversation import Conversation  # noqa: F401
from app.models.chat_message import ChatMessage  # noqa: F401

__all__ = [
    "Base",
    "User",
    "KnowledgeBase",
    "Document",
    "DocumentChunk",
    "Conversation",
    "ChatMessage",
]
