import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.document import Document, DocumentStatus, DocumentFileType
from app.models.knowledge_base import KnowledgeBase
from app.schemas.document import DocumentResponse, DocumentListResponse, DocumentStatusResponse
from app.core.config import settings
from app.services.rag_pipeline import process_document_background

router = APIRouter(prefix="/knowledge-bases/{kb_id}/documents", tags=["Documents"])

MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"

ALLOWED_EXTENSIONS = {
    "pdf": DocumentFileType.PDF,
    "docx": DocumentFileType.DOCX,
    "txt": DocumentFileType.TXT,
    "csv": DocumentFileType.CSV,
}


async def _get_kb_or_404(kb_id: str, db: AsyncSession) -> KnowledgeBase:
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id,
            KnowledgeBase.user_id == MOCK_USER_ID,
            KnowledgeBase.is_active == True,
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    return kb


@router.get("", response_model=DocumentListResponse)
async def list_documents(kb_id: str, db: AsyncSession = Depends(get_db)):
    """List all documents in a knowledge base."""
    await _get_kb_or_404(kb_id, db)
    count_result = await db.execute(
        select(func.count()).select_from(Document).where(Document.knowledge_base_id == kb_id)
    )
    total = count_result.scalar_one()
    result = await db.execute(
        select(Document)
        .where(Document.knowledge_base_id == kb_id)
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return DocumentListResponse(
        items=[DocumentResponse.model_validate(d) for d in docs], total=total
    )


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    kb_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a document to a knowledge base.
    Text extraction, chunking, embedding, and Qdrant indexing happen asynchronously.
    Poll GET /{doc_id}/status to track progress.
    """
    kb = await _get_kb_or_404(kb_id, db)

    # Validate extension
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '.{ext}'. Allowed: {list(ALLOWED_EXTENSIONS.keys())}",
        )

    # Read and check size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_file_size_mb:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_file_size_mb} MB limit",
        )

    # Save to disk
    os.makedirs(settings.upload_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4()}.{ext}"
    storage_path = os.path.join(settings.upload_dir, stored_name)
    async with aiofiles.open(storage_path, "wb") as f:
        await f.write(content)

    # Create DB record
    doc = Document(
        knowledge_base_id=kb_id,
        filename=stored_name,
        original_filename=file.filename or stored_name,
        file_type=ALLOWED_EXTENSIONS[ext],
        file_size_bytes=len(content),
        status=DocumentStatus.PENDING,
        storage_path=storage_path,
    )
    db.add(doc)
    kb.document_count = (kb.document_count or 0) + 1
    await db.commit()
    await db.refresh(doc)

    # Queue background processing
    background_tasks.add_task(process_document_background, doc.id)

    return DocumentResponse.model_validate(doc)


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(kb_id: str, doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.knowledge_base_id == kb_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentResponse.model_validate(doc)


@router.get("/{doc_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(kb_id: str, doc_id: str, db: AsyncSession = Depends(get_db)):
    """Poll this endpoint after upload to track processing status."""
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.knowledge_base_id == kb_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentStatusResponse.model_validate(doc)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(kb_id: str, doc_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a document, its DB chunks, and its Qdrant vectors."""
    from app.services.qdrant_service import qdrant_service
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.knowledge_base_id == kb_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Remove from Qdrant (best-effort)
    try:
        await qdrant_service.delete_document_chunks(doc_id)
    except Exception:
        pass

    await db.delete(doc)
    await db.flush()
