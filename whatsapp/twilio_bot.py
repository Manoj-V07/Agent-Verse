import os
import json
from datetime import datetime
import config

LOG_PATH = os.path.join(config.DATA_DIR, 'whatsapp_logs.json')

def get_log_path(workspace_dir: str = None) -> str:
    if workspace_dir:
        return os.path.join(workspace_dir, 'whatsapp_logs.json')
    return LOG_PATH

def get_whatsapp_logs(workspace_dir: str = None) -> list[dict]:
    """Retrieves all WhatsApp log records from disk."""
    log_path = get_log_path(workspace_dir)
    if not os.path.exists(log_path):
        return []
    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading WhatsApp logs: {e}")
        return []

def log_whatsapp_message(to_number: str, body: str, status: str, workspace_dir: str = None):
    """Saves a WhatsApp log record to disk."""
    logs = get_whatsapp_logs(workspace_dir)
    
    # Clean phone numbers for logging
    clean_to = to_number.replace("whatsapp:", "")
    
    new_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "to": clean_to,
        "body": body,
        "status": status
    }
    
    logs.append(new_entry)
    
    # Cap logs at 50 entries to avoid bloating
    if len(logs) > 50:
        logs = logs[-50:]
        
    log_path = get_log_path(workspace_dir)
    try:
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(logs, f, indent=4)
    except Exception as e:
        print(f"Error saving WhatsApp logs: {e}")

def clear_whatsapp_logs(workspace_dir: str = None):
    """Wipes the local simulated WhatsApp message history."""
    log_path = get_log_path(workspace_dir)
    if os.path.exists(log_path):
        try:
            os.remove(log_path)
        except Exception as e:
            print(f"Error clearing WhatsApp logs: {e}")

def send_whatsapp_message(body: str, to_number: str = None, workspace_dir: str = None) -> dict:
    """
    Sends a WhatsApp message using Twilio.
    Does NOT fall back to simulation if credentials exist or fail.
    """
    target_number = to_number or config.USER_WHATSAPP_NUMBER
    if not target_number:
        raise ValueError("Recipient WhatsApp number is missing.")
        
    # Clean and check whatsapp: prefix
    is_whatsapp_prefixed = target_number.startswith("whatsapp:")
    phone_part = target_number[9:] if is_whatsapp_prefixed else target_number
    
    # Prepend default country code if not starting with '+'
    if not phone_part.startswith("+"):
        default_code = getattr(config, "WHATSAPP_DEFAULT_COUNTRY_CODE", "+91")
        phone_part = phone_part.lstrip("0")
        phone_part = f"{default_code}{phone_part}"
        
    formatted_to = f"whatsapp:{phone_part}"

    sid = config.TWILIO_ACCOUNT_SID
    token = config.TWILIO_AUTH_TOKEN
    from_number = config.TWILIO_WHATSAPP_NUMBER
    
    if not (sid and token and from_number):
        raise ValueError("Twilio credentials (ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_NUMBER) are missing/incomplete in config.")
        
    from twilio.rest import Client
    client = Client(sid, token)
    message = client.messages.create(
        body=body,
        from_=from_number,
        to=formatted_to
    )
    log_whatsapp_message(formatted_to, body, "Sent via Twilio", workspace_dir)
    return {
        "success": True,
        "status": "sent",
        "message_sid": message.sid,
        "body": body,
        "to": formatted_to
    }
