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

    # 2. Images & PDFs (using Gemini multimodal OCR)
    elif ext in ['.pdf', '.png', '.jpg', '.jpeg']:
        if api_key:
            try:
                genai.configure(api_key=api_key)
                # Read file bytes
                with open(file_path, 'rb') as f:
                    file_data = f.read()
                
                mime_type = "application/pdf" if ext == ".pdf" else f"image/{ext[1:]}"
                if mime_type == "image/jpg": mime_type = "image/jpeg"
                
                model = genai.GenerativeModel('gemini-1.5-flash')
                prompt = (
                    "You are an expert OCR and invoice-parsing assistant. Extract all text, tables, "
                    "invoice details, vendor name, dates, item descriptions, and totals from this file. "
                    "Format the output in a clean, human-readable structure with markdown headers."
                )
                
                contents = [
                    {"mime_type": mime_type, "data": file_data},
                    prompt
                ]
                response = model.generate_content(contents)
                return response.text, "document"
            except Exception as e:
                print(f"Gemini Multimodal OCR failed: {e}. Falling back to mock extraction.")
        
        # Mock/Offline Parser fallback for invoices & receipts
        filename = os.path.basename(file_path).lower()
        if "invoice" in filename or "receipt" in filename:
            mock_ocr = (
                f"--- SIMULATED OCR DATA FOR: {os.path.basename(file_path)} ---\n"
                f"Document Type: Invoice\n"
                f"Vendor: Sri Balaji Traders\n"
                f"Invoice Date: 2026-06-10\n"
                f"Due Date: 2026-06-25\n"
                f"Invoice Number: SBT-99482\n"
                f"Items:\n"
                f"1. Premium Basmati Rice 5kg - Qty: 20 bags - Unit Price: Rs. 350 - Total: Rs. 7,000\n"
                f"2. Aashirvaad Shudh Chakki Atta 5kg - Qty: 15 bags - Unit Price: Rs. 220 - Total: Rs. 3,300\n"
                f"Subtotal: Rs. 10,300\n"
                f"SGST (9%): Rs. 927\n"
                f"CGST (9%): Rs. 927\n"
                f"Grand Total: Rs. 12,154\n"
                f"Payment Status: PENDING\n"
                f"Payment Instructions: UPI to balaji@upi or Bank transfer."
            )
            return mock_ocr, "document"
        else:
            return f"Mock text content for document {os.path.basename(file_path)}. (Upload a file with 'invoice' in its name for detailed mock OCR data).", "document"

    # 3. Audio Voice Notes (Speech-to-Text)
    elif ext in ['.wav', '.mp3', '.m4a', '.ogg']:
        if api_key:
            try:
                genai.configure(api_key=api_key)
                with open(file_path, 'rb') as f:
                    file_data = f.read()
                
                mime_type = f"audio/{ext[1:]}"
                if ext == '.m4a': mime_type = "audio/mp4" # Gemini expects mp4 for m4a
                
                model = genai.GenerativeModel('gemini-1.5-flash')
                prompt = (
                    "Transcribe this voice note exactly. If it is in Tamil or another Indian language, "
                    "transcribe the text in that language and also provide a translation in English."
                )
                
                contents = [
                    {"mime_type": mime_type, "data": file_data},
                    prompt
                ]
                response = model.generate_content(contents)
                return response.text, "audio"
            except Exception as e:
                print(f"Gemini Speech-to-Text failed: {e}. Falling back to mock transcription.")
                
        # Mock/Offline Audio fallbacks
        filename = os.path.basename(file_path).lower()
        if "tamil" in filename:
            return (
                "--- SIMULATED SPEECH-TO-TEXT ---\n"
                "Voice Note Transcription (Tamil):\n"
                "\"அடுத்த மாத விற்பனை எவ்வாறு இருக்கும் என்று கணித்து சொல்லுங்கள்.\"\n"
                "Translation (English):\n"
                "\"Predict and tell me how next month's sales will be.\""
            ), "audio"
        else:
            return (
                "--- SIMULATED SPEECH-TO-TEXT ---\n"
                "Voice Note Transcription (English):\n"
                "\"How is our stock level for Sunflower Oil? Do we need to restock?\""
            ), "audio"
            
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
    return f"Successfully processed '{filename}'. Extracted {len(chunks)} text chunks."

def retrieve_context(query: str, k: int = 3, workspace_dir: str = None) -> str:
    """
    Search the vector store for query context.
    Returns a consolidated string of matching text segments.
    """
    store = get_vector_store(workspace_dir)
    if not store.documents:
        return "No documents uploaded or indexed yet. Use the upload panel to index sales reports, invoices, or invoices."
        
    query_emb = get_embedding(query)
    matches = store.similarity_search(query_emb, k=k)
    
    context_blocks = []
    for m in matches:
        source = m["document"]["metadata"].get("source", "unknown")
        text = m["document"]["text"]
        score = m["score"]
        # Only use matches with positive similarity (helps filter out irrelevant stuff in mock mode)
        if score > 0.1:
            context_blocks.append(f"[Source: {source} | Match Score: {score:.3f}]\n{text}")
            
    if not context_blocks:
        return "No highly matching context found in uploaded documents."
        
    return "\n\n---\n\n".join(context_blocks)
