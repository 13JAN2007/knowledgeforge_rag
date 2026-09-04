"""
Qdrant Service — Full Implementation
Manages vector storage and similarity search.
"""
import asyncio
from dataclasses import dataclass
from app.core.config import settings


@dataclass
class SearchResult:
    chunk_id: str
    document_id: str
    knowledge_base_id: str
    content: str
    score: float
    page_number: int | None
    doc_name: str


class QdrantService:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from qdrant_client import QdrantClient
            self._client = QdrantClient(
                host=settings.qdrant_host,
                port=settings.qdrant_port,
                timeout=30,
            )
        return self._client

    async def ensure_collection(self):
        """Create the vector collection if it doesn't exist."""
        from qdrant_client.models import Distance, VectorParams
        client = self._get_client()

        def _create():
            collections = client.get_collections().collections
            names = [c.name for c in collections]
            if settings.qdrant_collection_name not in names:
                client.create_collection(
                    collection_name=settings.qdrant_collection_name,
                    vectors_config=VectorParams(
                        size=settings.embedding_dimension,
                        distance=Distance.COSINE,
                    ),
                )
                print(f"[OK] Qdrant collection '{settings.qdrant_collection_name}' created")
            else:
                print(f"[OK] Qdrant collection '{settings.qdrant_collection_name}' already exists")

        await asyncio.to_thread(_create)

    async def upsert_chunks(self, chunks: list[dict]) -> None:
        """
        Store chunk vectors in Qdrant.
        Each chunk dict: {qdrant_id, chunk_id, document_id, knowledge_base_id,
                          content, page_number, doc_name, embedding}
        """
        from qdrant_client.models import PointStruct
        client = self._get_client()

        points = [
            PointStruct(
                id=chunk["qdrant_id"],
                vector=chunk["embedding"],
                payload={
                    "chunk_id": chunk["chunk_id"],
                    "document_id": chunk["document_id"],
                    "knowledge_base_id": chunk["knowledge_base_id"],
                    "content": chunk["content"],
                    "page_number": chunk["page_number"],
                    "doc_name": chunk["doc_name"],
                },
            )
            for chunk in chunks
        ]

        def _upsert():
            # Upsert in batches of 100
            for i in range(0, len(points), 100):
                batch = points[i : i + 100]
                client.upsert(
                    collection_name=settings.qdrant_collection_name,
                    points=batch,
                )

        await asyncio.to_thread(_upsert)

    async def search(
        self,
        knowledge_base_id: str,
        query_embedding: list[float],
        top_k: int = 5,
    ) -> list[SearchResult]:
        """Find the top-k most similar chunks filtered by knowledge_base_id."""
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        client = self._get_client()

        def _search():
            if hasattr(client, "query_points"):
                res = client.query_points(
                    collection_name=settings.qdrant_collection_name,
                    query=query_embedding,
                    query_filter=Filter(
                        must=[
                            FieldCondition(
                                key="knowledge_base_id",
                                match=MatchValue(value=knowledge_base_id),
                            )
                        ]
                    ),
                    limit=top_k,
                    with_payload=True,
                )
                return res.points
            return client.search(
                collection_name=settings.qdrant_collection_name,
                query_vector=query_embedding,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="knowledge_base_id",
                            match=MatchValue(value=knowledge_base_id),
                        )
                    ]
                ),
                limit=top_k,
                with_payload=True,
            )

        results = await asyncio.to_thread(_search)

        return [
            SearchResult(
                chunk_id=r.payload.get("chunk_id", ""),
                document_id=r.payload.get("document_id", ""),
                knowledge_base_id=r.payload.get("knowledge_base_id", ""),
                content=r.payload.get("content", ""),
                score=float(r.score),
                page_number=r.payload.get("page_number"),
                doc_name=r.payload.get("doc_name", "Unknown"),
            )
            for r in results
        ]

    async def delete_document_chunks(self, document_id: str) -> None:
        """Remove all Qdrant points for a document."""
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        client = self._get_client()

        def _delete():
            client.delete(
                collection_name=settings.qdrant_collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id),
                        )
                    ]
                ),
            )

        await asyncio.to_thread(_delete)


qdrant_service = QdrantService()
