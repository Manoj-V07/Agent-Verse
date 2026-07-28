from agents.base_agent import call_llm

COMMUNICATION_SYSTEM_INSTRUCTION = (
    "You are the Communication Agent of AegisAI, a business copilot for Indian SMEs. "
    "Your role is to draft professional, brief WhatsApp notifications, alerts, summaries, or customer answers. "
    "When drafting notifications: "
    "- Keep the messages concise, action-oriented, and structured for mobile WhatsApp screens. "
    "- Use clear emojis at the start of lists or alerts (e.g., ⚠️, 📊, 🔔, ✅). "
    "- Ensure names, amounts, quantities, and next steps are highlighted clearly. "
    "- Write in English, or in Tamil/bilingual if requested. "
    "Always output the draft message clearly, separated by a line or inside a block, so the user knows exactly what will be sent."
)

def run_communication_agent(query: str, context: str, provider: str = "gemini") -> str:
    """Invokes the Communication Agent to draft alert payloads and WhatsApp copy."""
    prompt = f"RAG Data Context:\n{context}\n\nUser Question: {query}"
    return call_llm(COMMUNICATION_SYSTEM_INSTRUCTION, prompt, provider=provider)
