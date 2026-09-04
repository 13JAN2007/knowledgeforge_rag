"""
RAG Pipeline Orchestrator
--------------------------
Coordinates document processing and query answering:

Processing:  upload → extract text → chunk → embed → store in Qdrant → update DB
Querying:    question → embed → search Qdrant → build context → Gemini → answer + citations
"""
import asyncio
import uuid
import traceback
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.document import Document, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.models.knowledge_base import KnowledgeBase
from app.models.chat_message import ChatMessage, MessageRole
from app.models.conversation import Conversation
from app.services.document_processor import document_processor
from app.services.embedding_service import embedding_service
from app.services.qdrant_service import qdrant_service
from app.services.llm_service import llm_service


# ─── Document Processing Pipeline ────────────────────────────────────────────

async def process_document_background(document_id: str) -> None:
    """
    Full async pipeline — called as a FastAPI BackgroundTask after upload.
    Updates document status in DB throughout processing.
    """
    async with AsyncSessionLocal() as db:
        try:
            # Load document with retries to handle any commit latency
            doc = None
            for _ in range(5):
                result = await db.execute(
                    select(Document).where(Document.id == document_id)
                )
                doc = result.scalar_one_or_none()
                if doc:
                    break
                await asyncio.sleep(0.5)

            if not doc:
                print(f"[RAG] Document {document_id} not found after retries, skipping.")
                return

            print(f"[RAG] Starting processing: {doc.original_filename}")

            # Mark as processing
            doc.status = DocumentStatus.PROCESSING
            await db.commit()

            # ── Step 1: Extract text ──────────────────────────────────────
            print(f"[RAG] Extracting text from {doc.file_type.value.upper()}...")
            pages = await document_processor.extract_text(doc.storage_path, doc.file_type)
            if not pages:
                raise ValueError("No text could be extracted from the document.")

            # ── Step 2: Chunk text ────────────────────────────────────────
            print(f"[RAG] Chunking {len(pages)} pages...")
            chunks = await document_processor.chunk_text(pages)
            if not chunks:
                raise ValueError("No chunks produced — document may be empty.")
            print(f"[RAG] Created {len(chunks)} chunks")

            # ── Step 3: Generate embeddings ───────────────────────────────
            print(f"[RAG] Generating embeddings for {len(chunks)} chunks...")
            texts = [c.content for c in chunks]
            embeddings = await embedding_service.generate_embeddings(texts)
            print(f"[RAG] Embeddings generated: {len(embeddings)} vectors")

            # ── Step 4: Build DB + Qdrant records ────────────────────────
            db_chunks = []
            qdrant_chunks = []
            for chunk, embedding in zip(chunks, embeddings):
                chunk_id = str(uuid.uuid4())
                qdrant_point_id = str(uuid.uuid4())

                db_chunks.append(DocumentChunk(
                    id=chunk_id,
                    document_id=document_id,
                    knowledge_base_id=doc.knowledge_base_id,
                    content=chunk.content,
                    chunk_index=chunk.chunk_index,
                    page_number=chunk.page_number,
                    token_count=chunk.token_count,
                    qdrant_point_id=qdrant_point_id,
                ))

                qdrant_chunks.append({
                    "qdrant_id": qdrant_point_id,
                    "chunk_id": chunk_id,
                    "document_id": document_id,
                    "knowledge_base_id": doc.knowledge_base_id,
                    "content": chunk.content,
                    "page_number": chunk.page_number,
                    "doc_name": doc.original_filename,
                    "embedding": embedding,
                })

            # ── Step 5: Upsert to Qdrant ──────────────────────────────────
            print(f"[RAG] Upserting {len(qdrant_chunks)} vectors to Qdrant...")
            await qdrant_service.upsert_chunks(qdrant_chunks)

            # ── Step 6: Persist chunks to PostgreSQL ──────────────────────
            for db_chunk in db_chunks:
                db.add(db_chunk)

            # ── Step 7: Update document record ────────────────────────────
            page_count = max((c.page_number or 1) for c in chunks) if chunks else 0
            doc.status = DocumentStatus.READY
            doc.chunk_count = len(chunks)
            doc.page_count = page_count

            # Update KB counters
            kb_result = await db.execute(
                select(KnowledgeBase).where(KnowledgeBase.id == doc.knowledge_base_id)
            )
            kb = kb_result.scalar_one_or_none()
            if kb:
                kb.chunk_count = (kb.chunk_count or 0) + len(chunks)

            await db.commit()
            print(f"[RAG] [OK] Processing complete: {doc.original_filename} - {len(chunks)} chunks indexed")

        except Exception as e:
            print(f"[RAG] [ERROR] Processing failed for {document_id}: {e}")
            traceback.print_exc()
            async with AsyncSessionLocal() as err_db:
                err_result = await err_db.execute(
                    select(Document).where(Document.id == document_id)
                )
                failed_doc = err_result.scalar_one_or_none()
                if failed_doc:
                    failed_doc.status = DocumentStatus.ERROR
                    failed_doc.error_message = str(e)[:500]
                    await err_db.commit()


# ─── Query / Chat Pipeline ────────────────────────────────────────────────────

async def answer_question(
    question: str,
    knowledge_base_id: str,
    conversation_id: str,
    top_k: int = 5,
) -> dict:
    """
    Full RAG query pipeline:
    1. Embed the question
    2. Search Qdrant for relevant chunks
    3. Call Gemini with context
    4. Return answer + sources
    """
    # ── Step 1: Embed question ────────────────────────────────────────────
    query_embedding = await embedding_service.generate_query_embedding(question)

    # ── Step 2: Retrieve relevant chunks ─────────────────────────────────
    search_results = await qdrant_service.search(
        knowledge_base_id=knowledge_base_id,
        query_embedding=query_embedding,
        top_k=top_k,
    )

    # ── Step 3: Build context for LLM ────────────────────────────────────
    retrieved_chunks = [
        {
            "chunk_id": r.chunk_id,
            "document_id": r.document_id,
            "doc_name": r.doc_name,
            "page_number": r.page_number,
            "content": r.content,
            "score": r.score,
        }
        for r in search_results
    ]

    # ── Step 4: Load conversation history ────────────────────────────────
    history = []
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
        )
        recent_msgs = list(reversed(result.scalars().all()))
        history = [{"role": m.role.value, "content": m.content} for m in recent_msgs]

    # ── Step 5: Generate answer with Gemini ──────────────────────────────
    if not retrieved_chunks:
        answer = (
            "I couldn't find any relevant information in the knowledge base to answer your question. "
            "Please make sure documents have been uploaded and processed (status: Ready) in this knowledge base."
        )
        llm_result = {"answer": answer, "prompt_tokens": 0, "completion_tokens": 0}
    else:
        llm_result = await llm_service.generate_answer(
            query=question,
            retrieved_chunks=retrieved_chunks,
            conversation_history=history,
        )

    # ── Step 6: Format citations ──────────────────────────────────────────
    sources = [
        {
            "doc_id": r["document_id"],
            "doc_name": r["doc_name"],
            "page_number": r["page_number"],
            "chunk_id": r["chunk_id"],
            "score": round(r["score"], 4),
            "excerpt": r["content"][:200] + ("..." if len(r["content"]) > 200 else ""),
        }
        for r in retrieved_chunks
    ]

    return {
        "answer": llm_result["answer"],
        "sources": sources,
        "prompt_tokens": llm_result["prompt_tokens"],
        "completion_tokens": llm_result["completion_tokens"],
    }
