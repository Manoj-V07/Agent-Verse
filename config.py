import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# Base directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
WORKSPACES_DIR = os.path.join(DATA_DIR, 'workspaces')

# Create necessary directories
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(WORKSPACES_DIR, exist_ok=True)

# Configuration keys (default from environment)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886") # Default sandbox number
USER_WHATSAPP_NUMBER = os.getenv("USER_WHATSAPP_NUMBER", "") # The SME owner's phone

def is_gemini_available():
    """Checks if a Gemini API key is configured."""
    return len(GEMINI_API_KEY.strip()) > 0

def get_gemini_key():
    global GEMINI_API_KEY
    return GEMINI_API_KEY

def set_gemini_key(key: str):
    """Dynamically set the Gemini API key during runtime."""
    global GEMINI_API_KEY
    GEMINI_API_KEY = key
    os.environ["GEMINI_API_KEY"] = key

def is_groq_available():
    """Checks if a Groq API key is configured."""
    return len(GROQ_API_KEY.strip()) > 0

def get_groq_key():
    global GROQ_API_KEY
    return GROQ_API_KEY

def set_groq_key(key: str):
    """Dynamically set the Groq API key during runtime."""
    global GROQ_API_KEY
    GROQ_API_KEY = key
    os.environ["GROQ_API_KEY"] = key
