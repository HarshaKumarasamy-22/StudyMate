import os
from typing import Any
import pypdf


def extract_text_and_chunks(
    file_path: str, chunk_size: int = 800, chunk_overlap: int = 150
) -> tuple[int, list[dict[str, Any]]]:
    """
    Extracts text from a PDF file page by page, and splits it into
    overlapping text chunks for RAG embedding.

    Returns:
        tuple[num_pages, list of dicts with keys: chunk_index, page_number, content]
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at {file_path}")

    reader = pypdf.PdfReader(file_path)
    num_pages = len(reader.pages)

    chunks: list[dict[str, Any]] = []
    chunk_index = 0

    for page_idx, page in enumerate(reader.pages):
        page_num = page_idx + 1
        page_text = page.extract_text() or ""
        page_text = page_text.strip()

        if not page_text:
            continue

        # Split page text into overlapping chunks
        start = 0
        text_length = len(page_text)

        while start < text_length:
            end = start + chunk_size
            chunk_content = page_text[start:end].strip()

            if chunk_content:
                chunks.append(
                    {
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "content": chunk_content,
                    }
                )
                chunk_index += 1

            if end >= text_length:
                break

            start += chunk_size - chunk_overlap

    return num_pages, chunks
