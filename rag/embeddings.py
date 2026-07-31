import numpy as np
import hashlib
import google.generativeai as genai
import config

def _hash_fallback_embedding(text: str) -> list:
    """Deterministic 768-dim pseudo-embedding from SHA-256 hash (offline fallback)."""
    seed = int(hashlib.sha256(text.encode()).hexdigest(), 16) % (2**32)
    rng = np.random.default_rng(seed)
    vec = rng.standard_normal(768)
    return (vec / np.linalg.norm(vec)).tolist()

def get_embedding(text: str) -> list:
    """
    Generates a 768-dimensional embedding vector for the given text.
    Uses Gemini API with hash-based fallback on quota/rate-limit errors.
    """
    api_key = config.get_gemini_key()
    if not api_key:
        print("Gemini key missing, using hash fallback embedding.")
        return _hash_fallback_embedding(text)

    try:
        genai.configure(api_key=api_key)
        response = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type="retrieval_document",
            output_dimensionality=768
        )
        if 'embedding' in response:
            return response['embedding']
        elif isinstance(response, dict) and 'embeddings' in response:
            return response['embeddings'][0]['values']
        elif hasattr(response, 'embedding'):
            return response.embedding
        raise ValueError("Unexpected Gemini embedding response format.")
    except Exception as e:
        print(f"Gemini embedding failed ({e}), using hash fallback.")
        return _hash_fallback_embedding(text)
