"""
Embedding Service — Full Implementation
Uses Sentence Transformers to encode text into dense vectors.
"""
import asyncio
from app.core.config import settings


class EmbeddingService:
    def __init__(self):
        self._model = None

    def _get_model(self):
        """Lazy-load the model once and cache it."""
        if self._model is None:
            print(f"[INFO] Loading embedding model: {settings.embedding_model}")
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.embedding_model)
            print("[OK] Embedding model loaded")
        return self._model

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Encode a list of texts into embeddings. Runs in thread pool."""
        if not texts:
            return []
        loop = asyncio.get_event_loop()
        def _encode():
            model = self._get_model()
            return model.encode(
                texts,
                batch_size=32,
                show_progress_bar=False,
                convert_to_numpy=True,
            ).tolist()
        return await loop.run_in_executor(None, _encode)

    async def generate_query_embedding(self, query: str) -> list[float]:
        """Encode a single query string."""
        embeddings = await self.generate_embeddings([query])
        return embeddings[0]


embedding_service = EmbeddingService()
