"""
LLM Service — Full Implementation
Interfaces with Google Gemini API to generate grounded answers.
"""
from app.core.config import settings


SYSTEM_PROMPT = """You are KnowledgeForge AI, an expert assistant that answers questions \
based strictly on the provided document context.

Rules:
- Only use information from the provided context.
- If the context doesn't contain enough information, say so clearly — do not make things up.
- Always reference which source you are drawing from (e.g. "According to [document name], page X...").
- Be concise, accurate, and helpful.
- Format your response using markdown when it improves readability (lists, bold, code blocks).
- Do not repeat the question back to the user."""


class LLMService:
    def __init__(self):
        self._model = None

    def _get_model(self):
        if self._model is None:
            if not settings.gemini_api_key:
                raise ValueError(
                    "GEMINI_API_KEY is not set. Add it to your .env file."
                )
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            self._model = genai.GenerativeModel(
                model_name=settings.gemini_model,
                system_instruction=SYSTEM_PROMPT,
            )
            print(f"[OK] Gemini model '{settings.gemini_model}' initialized")
        return self._model

    def _build_context_prompt(self, query: str, retrieved_chunks: list[dict]) -> str:
        context_blocks = []
        for i, chunk in enumerate(retrieved_chunks, 1):
            page_info = f", Page {chunk['page_number']}" if chunk.get("page_number") else ""
            context_blocks.append(
                f"[Source {i}: {chunk['doc_name']}{page_info}]\n{chunk['content']}"
            )
        context = "\n\n---\n\n".join(context_blocks)
        return f"Context from documents:\n\n{context}\n\n---\n\nQuestion: {query}"

    async def generate_answer(
        self,
        query: str,
        retrieved_chunks: list[dict],
        conversation_history: list[dict] | None = None,
    ) -> dict:
        """
        Generate an answer from retrieved context using Gemini.
        Returns: {"answer": str, "prompt_tokens": int, "completion_tokens": int}
        """
        model = self._get_model()
        prompt = self._build_context_prompt(query, retrieved_chunks)

        # Build chat history if provided
        history = []
        if conversation_history:
            for msg in conversation_history[-6:]:  # last 3 exchanges
                role = "user" if msg["role"] == "user" else "model"
                history.append({"role": role, "parts": [msg["content"]]})

        if history:
            chat = model.start_chat(history=history)
            response = await chat.send_message_async(prompt)
        else:
            response = await model.generate_content_async(prompt)

        prompt_tokens = 0
        completion_tokens = 0
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            prompt_tokens = response.usage_metadata.prompt_token_count or 0
            completion_tokens = response.usage_metadata.candidates_token_count or 0

        return {
            "answer": response.text,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
        }


llm_service = LLMService()
