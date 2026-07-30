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
    Sends a WhatsApp message using Twilio if credentials exist,
    otherwise records it as a SIMULATED alert.
    """
    # Fallback to configured default recipient if none provided
    target_number = to_number or config.USER_WHATSAPP_NUMBER or "+919876543210"
    
    # Format target with "whatsapp:" prefix for Twilio compatibility
    if not target_number.startswith("whatsapp:"):
        formatted_to = f"whatsapp:{target_number}"
    else:
        formatted_to = target_number

    sid = config.TWILIO_ACCOUNT_SID
    token = config.TWILIO_AUTH_TOKEN
    from_number = config.TWILIO_WHATSAPP_NUMBER
    
    # Check if credentials are set
    if sid and token and from_number:
        try:
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
        except Exception as e:
            error_msg = f"Twilio API Error: {str(e)}"
            print(error_msg)
            # Log as failed but fallback to simulation
            log_whatsapp_message(formatted_to, f"{body}\n\n[Twilio Error: {str(e)}]", "Simulated (Twilio Failed)", workspace_dir)
            return {
                "success": False,
                "status": "failed_fallback_simulated",
                "error": error_msg,
                "body": body,
                "to": formatted_to
            }
    else:
        # Simulated mode (no Twilio credentials)
        log_whatsapp_message(formatted_to, body, "Simulated (Sandbox Mode)", workspace_dir)
        return {
            "success": True,
            "status": "simulated",
            "message_sid": f"SM_MOCK_{int(datetime.now().timestamp())}",
            "body": body,
            "to": formatted_to
        }
