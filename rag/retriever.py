import os
import pandas as pd
import google.generativeai as genai
import config
from rag.embeddings import get_embedding
from rag.vector_store import VectorStore

# Path to save the vector store pickle
VECTOR_STORE_PATH = os.path.join(config.DATA_DIR, 'vector_store.pkl')

def get_vector_store(workspace_dir: str = None) -> VectorStore:
    """Helper to initialize and load the vector store."""
    path = os.path.join(workspace_dir, 'vector_store.pkl') if workspace_dir else VECTOR_STORE_PATH
    store = VectorStore(path)
    store.load()
    return store

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """Splits a long text string into smaller overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def extract_text_from_file(file_path: str) -> tuple[str, str]:
    """
    Parses files (spreadsheets, PDFs, images, audio) to extract text content.
    Returns:
        tuple (extracted_text, file_type)
    """
    _, ext = os.path.splitext(file_path.lower())
    api_key = config.get_gemini_key()
    
    # 1. Spreadsheets & CSVs
    if ext in ['.csv', '.xlsx', '.xls']:
        try:
            if ext == '.csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
            # Convert dataframe to a readable text dump
            text_lines = [f"File: {os.path.basename(file_path)} (SME Tabular Data)"]
            text_lines.append(f"Columns: {', '.join(df.columns)}")
            text_lines.append("Rows sample:")
            for i, row in df.head(50).iterrows():
                row_str = " | ".join([f"{col}: {val}" for col, val in row.items()])
                text_lines.append(f"Row {i+1}: {row_str}")
            return "\n".join(text_lines), "tabular"
        except Exception as e:
            return f"Failed to parse spreadsheet: {str(e)}", "text"

    # 2. Images & PDFs (using Gemini multimodal OCR, fallback to basic extraction)
    elif ext in ['.pdf', '.png', '.jpg', '.jpeg']:
        api_key = config.get_gemini_key()
        if api_key:
            try:
                genai.configure(api_key=api_key)
                with open(file_path, 'rb') as f:
                    file_data = f.read()
                mime_type = "application/pdf" if ext == ".pdf" else f"image/{ext[1:]}"
                if mime_type == "image/jpg": mime_type = "image/jpeg"
                model = genai.GenerativeModel('gemini-2.0-flash')
                prompt = (
                    "You are an expert OCR and invoice-parsing assistant. Extract all text, tables, "
                    "invoice details, vendor name, dates, item descriptions, and totals from this file. "
                    "Format the output in a clean, human-readable structure with markdown headers."
                )
                response = model.generate_content([{"mime_type": mime_type, "data": file_data}, prompt])
                return response.text, "document"
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "quota" in err_str.lower():
                    print(f"Gemini OCR quota exceeded, skipping to pdfplumber fallback.")
                else:
                    print(f"Gemini OCR failed ({err_str[:100]}), falling back to text extraction.")
        # Fallback: try reading PDF as text directly
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            if text.strip():
                return text, "document"
        except Exception:
            pass
        return f"Could not extract text from {os.path.basename(file_path)}. Gemini OCR unavailable and no text layer found in PDF.", "document"

    # 3. Audio Voice Notes (Speech-to-Text via Gemini only)
    elif ext in ['.wav', '.mp3', '.m4a', '.ogg']:
        api_key = config.get_gemini_key()
        if not api_key:
            return "Audio transcription requires Gemini API key.", "audio"
        try:
            genai.configure(api_key=api_key)
            with open(file_path, 'rb') as f:
                file_data = f.read()
            mime_type = f"audio/{ext[1:]}"
            if ext == '.m4a': mime_type = "audio/mp4"
            model = genai.GenerativeModel('gemini-2.0-flash')
            prompt = (
                "Transcribe this voice note exactly. If it is in Tamil or another Indian language, "
                "transcribe the text in that language and also provide a translation in English."
            )
            response = model.generate_content([{"mime_type": mime_type, "data": file_data}, prompt])
            return response.text, "audio"
        except Exception as e:
            return f"Audio transcription failed: {str(e)}", "audio"
            
    # Default text/unsupported files
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        return content, "text"
    except Exception as e:
        return f"Unsupported file or unable to read: {str(e)}", "unknown"

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
