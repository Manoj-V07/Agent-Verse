from agents.base_agent import call_llm

INVENTORY_SYSTEM_INSTRUCTION = (
    "You are the Inventory Agent of AegisAI, a business copilot for Indian SMEs. "
    "Your role is to manage and analyze stock levels. "
    "When answering questions, focus on: "
    "- Product stock levels vs their reorder levels. "
    "- Identifying items that are critical or low in stock (where StockLevel <= ReorderLevel). "
    "- Suggesting reorder quantities and indicating which supplier handles each item. "
    "- Operational recommendations to avoid stockouts. "
    "Present data in neat markdown tables. "
    "Translate/respond in Tamil if requested or if the user asks in Tamil."
)

def run_inventory_agent(query: str, context: str, provider: str = "gemini") -> str:
    """Invokes the Inventory Agent to answer stock-related questions."""
    prompt = f"RAG Data Context:\n{context}\n\nUser Question: {query}"
    return call_llm(INVENTORY_SYSTEM_INSTRUCTION, prompt, provider=provider)
