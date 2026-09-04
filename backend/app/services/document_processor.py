"""
Document Processor Service — Full Implementation
Extracts text from PDF, DOCX, TXT, CSV and splits into chunks.
"""
import os
import re
from dataclasses import dataclass, field
from app.models.document import DocumentFileType


@dataclass
class TextChunk:
    content: str
    chunk_index: int
    page_number: int | None = None
    token_count: int = 0
    metadata: dict = field(default_factory=dict)


class DocumentProcessor:
    def __init__(self, chunk_size_words: int = 400, chunk_overlap_words: int = 50):
        self.chunk_size_words = chunk_size_words
        self.chunk_overlap_words = chunk_overlap_words

    async def extract_text(self, file_path: str, file_type: DocumentFileType) -> list[dict]:
        """
        Extract text from a document. Returns list of {"page_number": int, "text": str}.
        """
        if file_type == DocumentFileType.PDF:
            return self._extract_pdf(file_path)
        elif file_type == DocumentFileType.DOCX:
            return self._extract_docx(file_path)
        elif file_type == DocumentFileType.TXT:
            return self._extract_txt(file_path)
        elif file_type == DocumentFileType.CSV:
            return self._extract_csv(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    def _extract_pdf(self, file_path: str) -> list[dict]:
        import fitz  # PyMuPDF
        pages = []
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            text = self._clean_text(text)
            if text.strip():
                pages.append({"page_number": page_num + 1, "text": text})
        doc.close()
        return pages

    def _extract_docx(self, file_path: str) -> list[dict]:
        from docx import Document
        doc = Document(file_path)
        sections = []
        current_section = []
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                current_section.append(text)
            elif current_section:
                sections.append("\n".join(current_section))
                current_section = []
        if current_section:
            sections.append("\n".join(current_section))
        full_text = "\n\n".join(sections)
        return [{"page_number": 1, "text": self._clean_text(full_text)}]

    def _extract_txt(self, file_path: str) -> list[dict]:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        except UnicodeDecodeError:
            with open(file_path, "r", encoding="latin-1") as f:
                text = f.read()
        return [{"page_number": 1, "text": self._clean_text(text)}]

    def _extract_csv(self, file_path: str) -> list[dict]:
        import pandas as pd
        df = pd.read_csv(file_path)
        # Convert each row to readable text
        rows = []
        for _, row in df.iterrows():
            row_text = " | ".join(f"{col}: {val}" for col, val in row.items() if str(val) != "nan")
            if row_text:
                rows.append(row_text)
        # Also include headers context
        header_text = f"Columns: {', '.join(df.columns.tolist())}\n\n"
        full_text = header_text + "\n".join(rows)
        return [{"page_number": 1, "text": self._clean_text(full_text)}]

    def _clean_text(self, text: str) -> str:
        # Normalize whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        text = text.strip()
        return text

    async def chunk_text(self, pages: list[dict]) -> list[TextChunk]:
        """Sliding-window word-based chunker preserving page metadata."""
        chunks = []
        chunk_index = 0

        for page in pages:
            text = page["text"]
            page_number = page["page_number"]
            words = text.split()

            if not words:
                continue

            start = 0
            while start < len(words):
                end = min(start + self.chunk_size_words, len(words))
                chunk_words = words[start:end]
                chunk_content = " ".join(chunk_words).strip()

                if chunk_content:
                    chunks.append(TextChunk(
                        content=chunk_content,
                        chunk_index=chunk_index,
                        page_number=page_number,
                        token_count=len(chunk_words),
                    ))
                    chunk_index += 1

                if end >= len(words):
                    break
                start = end - self.chunk_overlap_words

        return chunks

    async def process_document(
        self, document_id: str, file_path: str, file_type: DocumentFileType
    ) -> list[TextChunk]:
        pages = await self.extract_text(file_path, file_type)
        chunks = await self.chunk_text(pages)
        return chunks


document_processor = DocumentProcessor()
