from typing import Optional
from openai import OpenAI
from sqlalchemy.orm import Session
from app.config import settings
from app.models.document import DocumentChunk


def get_openai_client() -> OpenAI:
    """Return an initialized OpenAI client."""
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your-openai-api-key-here":
        raise ValueError(
            "OPENAI_API_KEY is not configured. Please set a valid key in your .env file."
        )
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def get_embeddings_batch(texts: list[str], batch_size: int = 50) -> list[list[float]]:
    """
    Generate vector embeddings for a list of text strings using OpenAI.
    Batches inputs to avoid request payload limits.
    """
    if not texts:
        return []

    client = get_openai_client()
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        # Replace newlines with spaces for optimal embedding results as recommended by OpenAI
        cleaned_batch = [text.replace("\n", " ") for text in batch]

        response = client.embeddings.create(
            input=cleaned_batch,
            model=settings.EMBEDDING_MODEL,
        )
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings


def get_single_embedding(text: str) -> list[float]:
    """Generate vector embedding for a single text string."""
    embeddings = get_embeddings_batch([text])
    if not embeddings:
        raise ValueError("Failed to generate embedding for the provided text.")
    return embeddings[0]


def search_similar_chunks(
    db: Session,
    document_id: int,
    query: str,
    top_k: int = 5,
) -> list[DocumentChunk]:
    """
    Perform a vector similarity search across chunks of a specific document
    using pgvector cosine distance.
    """
    query_vector = get_single_embedding(query)

    # Order by cosine distance ascending (closest / most similar first)
    results = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
        .limit(top_k)
        .all()
    )

    return results
