# KnowledgeForge AI

> Production-quality full-stack Advanced RAG application — create knowledge bases, upload documents, and chat with your data using semantic search + Gemini.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Python FastAPI |
| Database | PostgreSQL 16 |
| Vector DB | Qdrant |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| LLM | Google Gemini 1.5 Flash |
| Styling | Vanilla CSS (dark glassmorphism) |

---

## Quick Start

### 1. Start Infrastructure

```bash
docker-compose up -d
```
This starts PostgreSQL (port 5432) and Qdrant (port 6333).

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy ..\\.env.example .env
# Edit .env and fill in GEMINI_API_KEY and other values

# Run migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/api/docs

### 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

App available at: http://localhost:5173

---

## Project Structure

```
RAG_application/
├── docker-compose.yml          # PostgreSQL + Qdrant
├── .env.example                # Environment variables template
├── .gitignore
├── README.md
│
├── frontend/                   # React + Vite
│   └── src/
│       ├── api/                # Axios API client
│       ├── components/         # UI components
│       ├── pages/              # Route-level pages
│       └── store/              # Zustand state stores
│
└── backend/                    # FastAPI
    ├── alembic/                # DB migrations
    ├── app/
    │   ├── api/v1/             # REST endpoints
    │   ├── core/               # Config, security
    │   ├── db/                 # DB engine, session
    │   ├── models/             # SQLAlchemy ORM
    │   ├── schemas/            # Pydantic schemas
    │   └── services/           # Business logic stubs
    └── requirements.txt
```

---

## Features (Phase 1)

- ✅ Complete project structure and architecture
- ✅ All database models (User, KnowledgeBase, Document, DocumentChunk, Conversation, ChatMessage)
- ✅ RESTful API with full CRUD for all entities
- ✅ Document upload endpoint (PDF, DOCX, TXT, CSV)
- ✅ Dark glassmorphism React UI with 6 pages
- ✅ Conversation sidebar + chat interface with citation cards
- ✅ Mock data for all UI components
- ✅ Alembic migrations

## Phase 2 (Coming Next)

- [ ] Document text extraction (PyMuPDF, python-docx, pandas)
- [ ] Text chunking with sentence boundary awareness
- [ ] Sentence Transformers embedding generation
- [ ] Qdrant vector upsert + semantic search
- [ ] Gemini API integration for grounded answers
- [ ] Real-time processing status polling
- [ ] JWT authentication

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
