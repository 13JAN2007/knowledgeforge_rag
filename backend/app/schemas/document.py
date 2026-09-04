from pydantic import BaseModel
from datetime import datetime
from app.models.document import DocumentStatus, DocumentFileType


class DocumentResponse(BaseModel):
    id: str
    knowledge_base_id: str
    filename: str
    original_filename: str
    file_type: DocumentFileType
    file_size_bytes: int
    status: DocumentStatus
    error_message: str | None
    page_count: int
    chunk_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int


class DocumentStatusResponse(BaseModel):
    id: str
    status: DocumentStatus
    error_message: str | None
    chunk_count: int
    page_count: int

    model_config = {"from_attributes": True}
