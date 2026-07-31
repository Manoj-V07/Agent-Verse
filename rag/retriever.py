import os
import pandas as pd
import config
from rag.embeddings import get_embedding
from rag.vector_store import VectorStore

VECTOR_STORE_PATH = os.path.join(config.DATA_DIR, 'vector_store.pkl')

def get_vector_store(workspace_dir: str = None) -> VectorStore:
    path = os.path.join(workspace_dir, 'vector_store.pkl') if workspace_dir else VECTOR_STORE_PATH
    store = VectorStore(path)
    store.load()
    return store

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start:start + chunk_size])
        start += chunk_size - overlap
    return chunks

def extract_text_from_file(file_path: str) -> tuple[str, str]:
    _, ext = os.path.splitext(file_path.lower())

    # 1. Spreadsheets & CSVs
    if ext in ['.csv', '.xlsx', '.xls']:
        try:
            df = pd.read_csv(file_path) if ext == '.csv' else pd.read_excel(file_path)
            lines = [f"File: {os.path.basename(file_path)}", f"Columns: {', '.join(df.columns)}", "Rows:"]
            for i, row in df.head(50).iterrows():
                lines.append("Row {}: {}".format(i + 1, " | ".join(f"{c}: {v}" for c, v in row.items())))
            return "\n".join(lines), "tabular"
        except Exception as e:
            return f"Failed to parse spreadsheet: {e}", "text"

    # 2. PDFs — pdfplumber text extraction
    elif ext == '.pdf':
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            if text.strip():
                return text, "document"
        except Exception as e:
            print(f"pdfplumber failed: {e}")
        return f"Could not extract text from {os.path.basename(file_path)}.", "document"

    # 3. Images — basic metadata only (no multimodal without Gemini)
    elif ext in ['.png', '.jpg', '.jpeg']:
        return f"Image file: {os.path.basename(file_path)}. OCR not available without Gemini API.", "image"

    # 4. Audio — not supported without Gemini
    elif ext in ['.wav', '.mp3', '.m4a', '.ogg']:
        return "Audio transcription requires Gemini API which has been disabled. Please upload a text or PDF file instead.", "audio"

    # 5. Plain text / unknown
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read(), "text"
    except Exception as e:
        return f"Unsupported file: {e}", "unknown"

def index_file(file_path: str, workspace_dir: str = None) -> str:
    """
    Reads a file, extracts its content, chunks it, embeds each chunk,
    and saves them in the vector database.
    Returns a success message.
    """
    if not os.path.exists(file_path):
        return f"File not found: {file_path}"
        
    text_content, file_type = extract_text_from_file(file_path)
    filename = os.path.basename(file_path)
    
    # Store the raw extracted text in a metadata field
    chunks = chunk_text(text_content, chunk_size=800, overlap=100)
    
    store = get_vector_store(workspace_dir)
    
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        metadata = {
            "source": filename,
            "chunk_index": i,
            "total_chunks": len(chunks),
            "file_type": file_type
        }
        store.add_document(chunk, embedding, metadata)
        
    store.save()
    # Return the extracted text so the frontend can display it
    preview = text_content[:2000] + ("..." if len(text_content) > 2000 else "")
    return f"Successfully processed '{filename}'. Extracted {len(chunks)} text chunks.\n\n--- EXTRACTED CONTENT ---\n{preview}"

def retrieve_context(query: str, k: int = 3, workspace_dir: str = None) -> str:
    """
    Search the vector store for query context.
    Uses cosine similarity if real embeddings exist, otherwise falls back to
    keyword matching so uploaded documents always return relevant context.
    """
    store = get_vector_store(workspace_dir)
    if not store.documents:
        return "No documents uploaded or indexed yet. Use the upload panel to index sales reports, invoices, or invoices."

    query_emb = get_embedding(query)
    matches = store.similarity_search(query_emb, k=k)

    # Check if we got meaningful similarity scores (real embeddings score > 0.3)
    best_score = max((m["score"] for m in matches), default=0)

    if best_score > 0.3:
        # Real semantic embeddings — use cosine results
        context_blocks = [
            f"[Source: {m['document']['metadata'].get('source', 'unknown')} | Score: {m['score']:.3f}]\n{m['document']['text']}"
            for m in matches if m["score"] > 0.3
        ]
    else:
        # Hash fallback — use keyword matching instead
        query_words = set(query.lower().split())
        scored = []
        for doc in store.documents:
            text_lower = doc["text"].lower()
            hits = sum(1 for w in query_words if len(w) > 3 and w in text_lower)
            if hits > 0:
                scored.append((hits, doc))
        scored.sort(key=lambda x: x[0], reverse=True)
        context_blocks = [
            f"[Source: {doc['metadata'].get('source', 'unknown')} | Keyword Hits: {hits}]\n{doc['text']}"
            for hits, doc in scored[:k]
        ]
        # If no keyword hits, just return all chunks (small doc)
        if not context_blocks:
            context_blocks = [
                f"[Source: {doc['metadata'].get('source', 'unknown')}]\n{doc['text']}"
                for doc in store.documents[:k]
            ]

    if not context_blocks:
        return "No matching context found in uploaded documents."

    return "\n\n---\n\n".join(context_blocks)
