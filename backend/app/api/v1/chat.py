from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.knowledge_base import KnowledgeBase
from app.models.chat_message import ChatMessage, MessageRole
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessageResponse

router = APIRouter(prefix="/chat", tags=["Chat"])

MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Send a question and receive a Gemini-generated answer with source citations.
    Uses the full RAG pipeline: embed → Qdrant search → Gemini → response.
    """
    from app.core.config import settings
    from app.services.rag_pipeline import answer_question
    from datetime import datetime, timezone

    # Verify conversation exists
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == payload.conversation_id,
            Conversation.user_id == MOCK_USER_ID,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        kb_result = await db.execute(select(KnowledgeBase).limit(1))
        default_kb = kb_result.scalar_one_or_none()
        kb_id = default_kb.id if default_kb else "kb-001"
        conv = Conversation(
            id=payload.conversation_id,
            knowledge_base_id=kb_id,
            user_id=MOCK_USER_ID,
            title=payload.question[:50],
        )
        db.add(conv)
        await db.flush()

    # Save user message
    user_msg = ChatMessage(
        conversation_id=payload.conversation_id,
        role=MessageRole.USER,
        content=payload.question,
    )
    db.add(user_msg)
    await db.flush()

    # ── Run RAG pipeline ──────────────────────────────────────────────────
    try:
        rag_result = await answer_question(
            question=payload.question,
            knowledge_base_id=conv.knowledge_base_id,
            conversation_id=payload.conversation_id,
            top_k=payload.top_k,
        )
        answer_content = rag_result["answer"]
        sources = rag_result["sources"]
        prompt_tokens = rag_result["prompt_tokens"]
        completion_tokens = rag_result["completion_tokens"]

    except ValueError as e:
        # Gemini API key not configured
        answer_content = (
            f"⚠️ Configuration needed: {e}\n\n"
            "Please add your `GEMINI_API_KEY` to the `.env` file and restart the backend."
        )
        sources = []
        prompt_tokens = 0
        completion_tokens = 0

    except Exception as e:
        answer_content = (
            f"An error occurred while generating a response: {str(e)}\n\n"
            "Please check the backend logs for details."
        )
        sources = []
        prompt_tokens = 0
        completion_tokens = 0

    # Save assistant message
    assistant_msg = ChatMessage(
        conversation_id=payload.conversation_id,
        role=MessageRole.ASSISTANT,
        content=answer_content,
        sources=sources if sources else None,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )
    db.add(assistant_msg)

    # Update conversation timestamp
    conv.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(assistant_msg)

    return ChatResponse(
        conversation_id=payload.conversation_id,
        message=ChatMessageResponse.model_validate(assistant_msg),
    )


@router.get("/{conversation_id}/messages", response_model=list[ChatMessageResponse])
async def get_messages(conversation_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve all messages in a conversation in chronological order."""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc())
    )
    msgs = result.scalars().all()
    return [ChatMessageResponse.model_validate(m) for m in msgs]
