import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
WORKSPACES_DIR = os.path.join(DATA_DIR, 'workspaces')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(WORKSPACES_DIR, exist_ok=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_KEY_BACKUP = os.getenv("GROQ_API_KEY_BACKUP", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
USER_WHATSAPP_NUMBER = os.getenv("USER_WHATSAPP_NUMBER", "")
MONGO_URI = os.getenv("MONGO_URI", "")
WHATSAPP_DEFAULT_COUNTRY_CODE = os.getenv("WHATSAPP_DEFAULT_COUNTRY_CODE", "+91")

def is_groq_available():
    return len(GROQ_API_KEY.strip()) > 0

def get_groq_key():
    return GROQ_API_KEY

def get_groq_backup_key():
    return GROQ_API_KEY_BACKUP

def is_groq_backup_available():
    return len(GROQ_API_KEY_BACKUP.strip()) > 0

# Keep stubs so existing imports don't break
def is_gemini_available():
    return False

def get_gemini_key():
    return ""
