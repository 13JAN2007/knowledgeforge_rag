from pydantic import BaseModel
from datetime import datetime
from app.models.chat_message import MessageRole


class CitationSource(BaseModel):
    doc_id: str
    doc_name: str
    page_number: int | None = None
    chunk_id: str
    score: float
    excerpt: str | None = None


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: MessageRole
    content: str
    sources: list[CitationSource] | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    conversation_id: str
    question: str
    top_k: int = 5


class ChatResponse(BaseModel):
    message: ChatMessageResponse
    conversation_id: str
