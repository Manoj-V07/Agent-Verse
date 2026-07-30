import numpy as np
import hashlib
import google.generativeai as genai
import config

def get_embedding(text: str) -> list:
    """
    Generates a 768-dimensional embedding vector for the given text.
    Uses Gemini API. Does NOT fall back to mock embedding vectors.
    """
    api_key = config.get_gemini_key()
    if not api_key:
        raise ValueError("Gemini API key is empty/missing in config.")
        
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
    else:
        raise ValueError("Failed to retrieve embedding from Gemini response.")
