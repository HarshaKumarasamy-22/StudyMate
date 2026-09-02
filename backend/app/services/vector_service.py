import hashlib
import math
from typing import List, Optional
from openai import OpenAI
from sqlalchemy.orm import Session
from app.config import settings
from app.models.document import DocumentChunk


def get_llm_client() -> tuple[OpenAI, str]:
    """Return an initialized OpenAI-compatible client and active model name."""
    if settings.LLM_PROVIDER == "groq" and settings.GROQ_API_KEY:
        return OpenAI(
            base_url=settings.GROQ_BASE_URL, api_key=settings.GROQ_API_KEY
        ), settings.GROQ_MODEL
    elif settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your-openai-api-key-here":
        return OpenAI(api_key=settings.OPENAI_API_KEY), settings.OPENAI_MODEL
    elif settings.GROQ_API_KEY:
        return OpenAI(
            base_url=settings.GROQ_BASE_URL, api_key=settings.GROQ_API_KEY
        ), settings.GROQ_MODEL
    else:
        raise ValueError(
            "No LLM API key configured. Please set GROQ_API_KEY in backend/.env"
        )


def _generate_local_fallback_embedding(text: str, dim: int = 1536) -> list[float]:
    """
    Deterministic pseudo-embedding for local testing when OpenAI embedding key is not present.
    Creates a 1536-dim normalized vector based on hashed n-grams.
    """
    vector = [0.0] * dim
    words = text.lower().split()
    for word in words:
        # Hash word into bucket
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vector[idx] += 1.0

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vector))
    if norm > 0:
        vector = [x / norm for x in vector]
    return vector


def get_embeddings_batch(texts: list[str], batch_size: int = 50) -> list[list[float]]:
    """
    Generate vector embeddings. Uses OpenAI if key is present,
    otherwise uses local deterministic embedding.
    """
    if not texts:
        return []

    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your-openai-api-key-here":
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            all_embeddings: list[list[float]] = []

            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                cleaned_batch = [text.replace("\n", " ") for text in batch]
                response = client.embeddings.create(
                    input=cleaned_batch,
                    model=settings.EMBEDDING_MODEL,
                )
                all_embeddings.extend([item.embedding for item in response.data])
            return all_embeddings
        except Exception:
            pass

    # Free fallback embedding generator (1536-dim matching PostgreSQL pgvector column)
    return [_generate_local_fallback_embedding(t) for t in texts]


def get_single_embedding(text: str) -> list[float]:
    """Generate vector embedding for a single query string."""
    embeddings = get_embeddings_batch([text])
    return embeddings[0]


def search_similar_chunks(
    db: Session,
    document_id: int,
    query: str,
    top_k: int = 5,
) -> list[DocumentChunk]:
    """
    Perform a vector similarity search across chunks of a specific document.
    """
    query_vector = get_single_embedding(query)

    # Order by cosine distance ascending (closest match first)
    results = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
        .limit(top_k)
        .all()
    )

    return results
