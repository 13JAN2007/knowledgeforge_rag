from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.knowledge_base import KnowledgeBase
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.schemas.knowledge_base import (
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
    KnowledgeBaseResponse,
    KnowledgeBaseListResponse,
)

router = APIRouter(prefix="/knowledge-bases", tags=["Knowledge Bases"])

# Using a mock user ID for now (auth to be wired later)
MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"


@router.get("", response_model=KnowledgeBaseListResponse)
async def list_knowledge_bases(
    skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)
):
    """List all knowledge bases for the current user."""
    count_result = await db.execute(
        select(func.count()).select_from(KnowledgeBase).where(
            KnowledgeBase.user_id == MOCK_USER_ID,
            KnowledgeBase.is_active == True,
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(KnowledgeBase)
        .where(KnowledgeBase.user_id == MOCK_USER_ID, KnowledgeBase.is_active == True)
        .order_by(KnowledgeBase.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    kbs = result.scalars().all()
    items = []
    for kb in kbs:
        doc_count = (await db.execute(
            select(func.count()).select_from(Document).where(Document.knowledge_base_id == kb.id)
        )).scalar_one()
        chunk_count = (await db.execute(
            select(func.count()).select_from(DocumentChunk).where(DocumentChunk.knowledge_base_id == kb.id)
        )).scalar_one()
        kb.document_count = doc_count
        kb.chunk_count = chunk_count
        items.append(KnowledgeBaseResponse.model_validate(kb))

    return KnowledgeBaseListResponse(items=items, total=total)


@router.post("", response_model=KnowledgeBaseResponse, status_code=status.HTTP_201_CREATED)
async def create_knowledge_base(
    payload: KnowledgeBaseCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new knowledge base."""
    kb = KnowledgeBase(
        user_id=MOCK_USER_ID,
        name=payload.name,
        description=payload.description,
    )
    db.add(kb)
    await db.flush()
    await db.refresh(kb)
    return KnowledgeBaseResponse.model_validate(kb)


@router.get("/{kb_id}", response_model=KnowledgeBaseResponse)
async def get_knowledge_base(kb_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific knowledge base by ID."""
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id, KnowledgeBase.user_id == MOCK_USER_ID
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    
    doc_count = (await db.execute(
        select(func.count()).select_from(Document).where(Document.knowledge_base_id == kb.id)
    )).scalar_one()
    chunk_count = (await db.execute(
        select(func.count()).select_from(DocumentChunk).where(DocumentChunk.knowledge_base_id == kb.id)
    )).scalar_one()
    kb.document_count = doc_count
    kb.chunk_count = chunk_count
    return KnowledgeBaseResponse.model_validate(kb)


@router.patch("/{kb_id}", response_model=KnowledgeBaseResponse)
async def update_knowledge_base(
    kb_id: str, payload: KnowledgeBaseUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a knowledge base's name or description."""
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id, KnowledgeBase.user_id == MOCK_USER_ID
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    if payload.name is not None:
        kb.name = payload.name
    if payload.description is not None:
        kb.description = payload.description
    await db.flush()
    await db.refresh(kb)
    return KnowledgeBaseResponse.model_validate(kb)


@router.delete("/{kb_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_knowledge_base(kb_id: str, db: AsyncSession = Depends(get_db)):
    """Soft-delete a knowledge base."""
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id, KnowledgeBase.user_id == MOCK_USER_ID
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    kb.is_active = False
    await db.flush()
