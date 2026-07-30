import os
from datetime import datetime
import config

# ---------------------------------------------------------------------------
# WhatsApp log helpers — backed by MongoDB (workspace-scoped)
# ---------------------------------------------------------------------------

def _get_collection():
    """Lazily import the db object to avoid circular imports."""
    from database import db
    return db.whatsapp_logs


def get_whatsapp_logs(workspace_dir: str = None) -> list[dict]:
    """Retrieve all WhatsApp log records for a workspace from MongoDB."""
    workspace_id = _workspace_id_from_dir(workspace_dir)
    try:
        query = {"workspace_id": workspace_id} if workspace_id else {}
        logs = list(
            _get_collection()
            .find(query, {"_id": 0})
            .sort("timestamp", -1)
            .limit(50)
        )
        # Return in chronological order
        return list(reversed(logs))
    except Exception as e:
        print(f"[WhatsApp] Error reading logs: {e}")
        return []


def log_whatsapp_message(
    to_number: str = None,
    body: str = "",
    status: str = "Unknown",
    workspace_dir: str = None,
    from_number: str = None,
):
    """Save a WhatsApp log record to MongoDB."""
    workspace_id = _workspace_id_from_dir(workspace_dir)
    clean_to = (to_number or "").replace("whatsapp:", "")

    entry = {
        "workspace_id": workspace_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "to": clean_to,
        "from": from_number or "",
        "body": body,
        "status": status,
    }

    try:
        _get_collection().insert_one(entry)

        # Cap at 50 per workspace — remove oldest if over limit
        count = _get_collection().count_documents({"workspace_id": workspace_id})
        if count > 50:
            oldest = list(
                _get_collection()
                .find({"workspace_id": workspace_id})
                .sort("timestamp", 1)
                .limit(count - 50)
            )
            ids = [doc["_id"] for doc in oldest]
            _get_collection().delete_many({"_id": {"$in": ids}})
    except Exception as e:
        print(f"[WhatsApp] Error saving log: {e}")


def clear_whatsapp_logs(workspace_dir: str = None):
    """Delete all WhatsApp log records for a workspace from MongoDB."""
    workspace_id = _workspace_id_from_dir(workspace_dir)
    try:
        query = {"workspace_id": workspace_id} if workspace_id else {}
        _get_collection().delete_many(query)
    except Exception as e:
        print(f"[WhatsApp] Error clearing logs: {e}")


def _workspace_id_from_dir(workspace_dir: str | None) -> str | None:
    """Extract the workspace_id from a workspace directory path."""
    if not workspace_dir:
        return None
    return os.path.basename(workspace_dir.rstrip("/\\"))


def send_whatsapp_message(body: str, to_number: str = None, workspace_dir: str = None) -> dict:
    """
    Sends a WhatsApp message using Twilio.
    Does NOT fall back to simulation if credentials exist or fail.
    """
    target_number = to_number or config.USER_WHATSAPP_NUMBER or "+919876543210"

    is_whatsapp_prefixed = target_number.startswith("whatsapp:")
    phone_part = target_number[9:] if is_whatsapp_prefixed else target_number

    if not phone_part.startswith("+"):
        default_code = getattr(config, "WHATSAPP_DEFAULT_COUNTRY_CODE", "+91")
        phone_part = phone_part.lstrip("0")
        phone_part = f"{default_code}{phone_part}"

    formatted_to = f"whatsapp:{phone_part}"

    sid = config.TWILIO_ACCOUNT_SID
    token = config.TWILIO_AUTH_TOKEN
    from_number = config.TWILIO_WHATSAPP_NUMBER

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
            log_whatsapp_message(
                formatted_to,
                f"{body}\n\n[Twilio Error: {str(e)}]",
                "Simulated (Twilio Failed)",
                workspace_dir
            )
            return {
                "success": False,
                "status": "failed_fallback_simulated",
                "error": error_msg,
                "body": body,
                "to": formatted_to
            }
    else:
        log_whatsapp_message(formatted_to, body, "Simulated (Sandbox Mode)", workspace_dir)
        return {
            "success": True,
            "status": "simulated",
            "message_sid": f"SM_MOCK_{int(datetime.now().timestamp())}",
            "body": body,
            "to": formatted_to
        }
