# KnowledgeForge AI

> Production-quality full-stack Advanced RAG application — create knowledge bases, upload documents, and chat with your data using semantic search + Gemini.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (Dark Glassmorphism) |
| Backend | Python FastAPI (Async) |
| Database | PostgreSQL 16 (Port 5433) |
| Vector DB | Qdrant (Port 6333) |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| LLM | Google Gemini 3.6 Flash |
| Styling | Vanilla CSS (Dark Glassmorphism design system) |

---

## Quick Start (1-Click)

### 1. Launch Everything

Simply double-click:
```bash
start.bat
```
*(or run `.\start.bat` in PowerShell)*

This automatically starts Docker containers (PostgreSQL & Qdrant), boots the FastAPI backend (`http://localhost:8000`), launches the Vite frontend (`http://localhost:5173`), and opens your browser.

To stop all services when finished, double-click `stop.bat`.

---

## Features

- ✅ **Full-Stack Architecture:** Decoupled FastAPI backend and React frontend.
- ✅ **Multi-Format Ingestion:** Extracts text from PDF (PyMuPDF), Word (python-docx), TXT, and CSV (pandas).
- ✅ **Local Vector Embeddings:** Zero-cost semantic vector generation using `all-MiniLM-L6-v2`.
- ✅ **Vector Similarity Search:** High-performance Qdrant vector indexing and filtering by knowledge base.
- ✅ **Grounded Generation:** Google Gemini 3.6 Flash integration with strict context citations and source attribution.
- ✅ **Multi-Knowledge Base Support:** Organize documents and chat history into separate collections.
- ✅ **Real-Time Asynchronous Processing:** Background document processing with live status polling.
- ✅ **PostgreSQL Database:** Complete relational schema with Alembic migrations.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/knowledge-bases` | List knowledge bases |
| POST | `/api/v1/knowledge-bases` | Create knowledge base |
| GET | `/api/v1/knowledge-bases/{id}` | Get knowledge base |
| POST | `/api/v1/knowledge-bases/{id}/documents/upload` | Upload document |
| GET | `/api/v1/knowledge-bases/{id}/documents` | List documents |
| POST | `/api/v1/knowledge-bases/{id}/conversations` | Create conversation |
| POST | `/api/v1/chat` | Send chat message |
| GET | `/api/v1/chat/{conv_id}/messages` | Get messages |
