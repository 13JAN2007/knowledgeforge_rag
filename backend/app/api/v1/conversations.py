from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.knowledge_base import KnowledgeBase
from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationListResponse,
)

router = APIRouter(prefix="/knowledge-bases/{kb_id}/conversations", tags=["Conversations"])

MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"


async def _get_kb_or_404(kb_id: str, db: AsyncSession) -> KnowledgeBase:
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id, KnowledgeBase.user_id == MOCK_USER_ID
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    return kb


@router.get("", response_model=ConversationListResponse)
async def list_conversations(kb_id: str, db: AsyncSession = Depends(get_db)):
    """List all conversations for a knowledge base."""
    await _get_kb_or_404(kb_id, db)
    count_result = await db.execute(
        select(func.count()).select_from(Conversation).where(
            Conversation.knowledge_base_id == kb_id, Conversation.user_id == MOCK_USER_ID
        )
    )
    total = count_result.scalar_one()
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.knowledge_base_id == kb_id, Conversation.user_id == MOCK_USER_ID
        )
        .order_by(Conversation.updated_at.desc())
    )
    convos = result.scalars().all()
    return ConversationListResponse(
        items=[ConversationResponse.model_validate(c) for c in convos], total=total
    )


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    kb_id: str, payload: ConversationCreate, db: AsyncSession = Depends(get_db)
):
    """Start a new conversation in a knowledge base."""
    await _get_kb_or_404(kb_id, db)
    convo = Conversation(
        knowledge_base_id=kb_id,
        user_id=MOCK_USER_ID,
        title=payload.title,
    )
    db.add(convo)
    await db.flush()
    await db.refresh(convo)
    return ConversationResponse.model_validate(convo)


@router.get("/{conv_id}", response_model=ConversationResponse)
async def get_conversation(kb_id: str, conv_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific conversation."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conv_id, Conversation.knowledge_base_id == kb_id
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return ConversationResponse.model_validate(conv)


@router.patch("/{conv_id}", response_model=ConversationResponse)
async def update_conversation(
    kb_id: str, conv_id: str, payload: ConversationUpdate, db: AsyncSession = Depends(get_db)
):
    """Rename a conversation."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conv_id, Conversation.knowledge_base_id == kb_id
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    conv.title = payload.title
    await db.flush()
    await db.refresh(conv)
    return ConversationResponse.model_validate(conv)


@router.delete("/{conv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(kb_id: str, conv_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a conversation and all its messages."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conv_id, Conversation.knowledge_base_id == kb_id
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    await db.delete(conv)
    await db.flush()
