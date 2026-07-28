import numpy as np
import hashlib
import google.generativeai as genai
import config

def get_embedding(text: str) -> list:
    """
    Generates a 768-dimensional embedding vector for the given text.
    Uses Gemini API if available, otherwise falls back to a deterministic mock vector.
    """
    api_key = config.get_gemini_key()
    
    if api_key:
        try:
            genai.configure(api_key=api_key)
            # Use text-embedding-004 (or models/embedding-001)
            response = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            if 'embedding' in response:
                return response['embedding']
            elif isinstance(response, dict) and 'embeddings' in response:
                # Sometimes it returns a dict of embeddings
                return response['embeddings'][0]['values']
            elif hasattr(response, 'embedding'):
                return response.embedding
        except Exception as e:
            print(f"Gemini Embedding API failed ({e}). Falling back to deterministic mock embedding.")
            
    # Token-based random indexing fallback (word-bag hashing)
    # Extract alphanumeric words and lowercase
    import re
    words = re.findall(r'\w+', text.lower())
    if not words:
        words = ["empty"]
        
    # Basic English & Tamil stop words to reduce noise
    stopwords = {
        "who", "and", "where", "are", "they", "the", "is", "in", "a", "of", "to", "for", "on", "at", "by", "an", "this", "it",
        "வணக்கம்", "மற்றும்", "இலிருந்து", "ஆகும்", "உள்ளது"
    }
    
    filtered_words = [w for w in words if w not in stopwords and len(w) > 2]
    if not filtered_words:
        filtered_words = words
        
    # Generate and sum word-level vectors
    accum_vector = np.zeros(768)
    for w in filtered_words:
        hash_object = hashlib.md5(w.encode('utf-8'))
        seed = int(hash_object.hexdigest(), 16) % (2**32 - 1)
        
        rng = np.random.default_rng(seed)
        word_vector = rng.normal(loc=0.0, scale=0.1, size=768)
        accum_vector += word_vector
        
    # L2 normalize the accumulated vector
    norm = np.linalg.norm(accum_vector)
    if norm > 0:
        accum_vector = accum_vector / norm
        
    return accum_vector.tolist()
