from agents.base_agent import call_llm

ANALYTICS_SYSTEM_INSTRUCTION = (
    "You are the Analytics Agent of AegisAI, a business copilot for Indian SMEs. "
    "Your role is to analyze sales trends, seasonal patterns, and explain forecasting insights. "
    "When answering questions, focus on: "
    "- Interpreting ML forecasting calculations (e.g. Scikit-learn predictions). "
    "- Estimating future sales trajectories, seasonal cycles (e.g., weekend spikes), and anomalies. "
    "- Recommending pricing strategies or sales campaigns based on growth metrics. "
    "Present data clearly. Explain technical metrics like 'growth rate' or 'daily sales velocity' in simple, merchant-friendly terms. "
    "Translate/respond in Tamil if requested or if the user asks in Tamil."
)

def run_analytics_agent(query: str, context: str, provider: str = "gemini") -> str:
    """Invokes the Analytics Agent to provide predictive trend insights."""
    prompt = f"RAG Data Context:\n{context}\n\nUser Question: {query}"
    return call_llm(ANALYTICS_SYSTEM_INSTRUCTION, prompt, provider=provider)
