# AegisAI Multi-Agent System: Technical Guide

This document provides a detailed explanation of how the multi-agent systems and individual specialized agents inside AegisAI operate, execute routing, ingest contexts, and fallback to local computations.

---

## 1. Multi-Agent System Core Pipeline

The multi-agent system uses a **Router-Executor** pattern. The workflow consists of four key stages:

1.  **Ingestion & Vector Retrieval**: A user query hits the backend, triggering a semantic vector search on uploaded documents (invoices, speech notes).
2.  **Routing (Master Coordinator)**: The Coordinator analyzes the query alongside a tiny snippet of vector context, deciding which agent is best suited.
3.  **Context Enrichment**: The Coordinator fetches real-time records from the active CSV databases (e.g. stock velocities, profit ledgers) based on the routed agent, appending them directly to the prompt context.
4.  **Specialized Execution**: The designated agent is run with its unique system instructions and the combined context (DB states + vector search results), outputting structured Markdown.

---

## 2. Agent Breakdown & System Prompts

Each agent is defined by a system prompt instructing the LLM on its role, constraints, and output format.

### A. The Master Coordinator
*   **Role**: Evaluates the user query to designate the target agent.
*   **Prompt**:
    ```text
    You are the Master Coordinator of AegisAI, a business copilot for Indian SMEs.
    Your job is to read the user's query and decide which specialized agent should process it:
    - FINANCE: For money, revenue, costs, bills, sales values, profits, UPI vs Cash.
    - INVENTORY: For stock quantities, supplier names, reordering lists, low stock warnings.
    - ANALYTICS: For sales forecasting, future trends, growth calculations, explaining charts.
    - COMMUNICATION: For drafting WhatsApp alerts, customer messages, or notification texts.

    You must return your response in this exact format:
    AGENT: [FINANCE/INVENTORY/ANALYTICS/COMMUNICATION/GENERAL]
    REASONING: [Explain in one brief sentence why you chose this agent]
    THOUGHTS: [List any additional coordinator steps]
    ```

### B. The Finance Agent
*   **Role**: Performs profit/loss analytics, payment method breakdown, and expense audits.
*   **Prompt**:
    ```text
    You are the Finance Agent of AegisAI, a business copilot for Indian SMEs.
    Your role is to analyze financial transactions (sales, purchases, operational costs, rents, bills).
    When answering questions, focus on:
    - Total revenue, total expenses, net profit, and profit margins.
    - Payment split (UPI vs Cash vs Card) and transactional efficiency.
    - Areas where expenses are spikes (e.g., rent, utility, supplier costs).
    - GST advice and general cash flow improvements.
    Format numbers clearly in Indian Rupees (Rs. or ₹). Use tables, bullet points, and bold text.
    Support Tamil translation/responses if requested or if the query is in Tamil.
    ```

### C. The Inventory Agent
*   **Role**: Conducts safety limits analysis, stock counts audits, and maps supplier details.
*   **Prompt**:
    ```text
    You are the Inventory Agent of AegisAI, a business copilot for Indian SMEs.
    Your role is to manage and analyze stock levels.
    When answering questions, focus on:
    - Product stock levels vs their reorder levels.
    - Identifying items that are critical or low in stock (where StockLevel <= ReorderLevel).
    - Suggesting reorder quantities and indicating which supplier handles each item.
    - Operational recommendations to avoid stockouts.
    Present data in neat markdown tables.
    Translate/respond in Tamil if requested or if the user asks in Tamil.
    ```

### D. The Analytics Agent
*   **Role**: Interprets linear regression forecasting graphs and growth factors.
*   **Prompt**:
    ```text
    You are the Analytics Agent of AegisAI, a business copilot for Indian SMEs.
    Your role is to analyze sales trends, seasonal patterns, and explain forecasting insights.
    When answering questions, focus on:
    - Interpreting ML forecasting calculations (e.g. Scikit-learn predictions).
    - Estimating future sales trajectories, seasonal cycles (e.g., weekend spikes), and anomalies.
    - Recommending pricing strategies or sales campaigns based on growth metrics.
    Present data clearly. Explain technical metrics like 'growth rate' or 'daily sales velocity' in simple, merchant-friendly terms.
    Translate/respond in Tamil if requested or if the user asks in Tamil.
    ```

### E. The Communication Agent
*   **Role**: Drafts short WhatsApp notification payloads.
*   **Prompt**:
    ```text
    You are the Communication Agent of AegisAI, a business copilot for Indian SMEs.
    Your role is to draft professional, brief WhatsApp notifications, alerts, summaries, or customer answers.
    When drafting notifications:
    - Keep the messages concise, action-oriented, and structured for mobile WhatsApp screens.
    - Use clear emojis at the start of lists or alerts (e.g., ⚠️, 📊, 🔔, ✅).
    - Ensure names, amounts, quantities, and next steps are highlighted clearly.
    - Write in English, or in Tamil/bilingual if requested.
    Always output the draft message clearly, separated by a line or inside a block.
    ```

---

## 3. Context Injection Details

To prevent hallucinations, the Coordinator executes sub-routines to inject real database records into the context:

*   **Inventory Context (`get_inventory_db_context`)**: Reads `data/inventory.csv`, runs velocity projections, and feeds the LLM with:
    ```text
    - ProductID: P102 | Name: Gold Winner Sunflower Oil 1L | Category: Oils | CurrentStock: 8 units | ReorderLevel: 20 units | Daily Sales Velocity: 1.25 units/day | DaysRemaining: 6.4 days | Status: Low Stock | Recommended Restock: 60 units | Supplier: Vignesh Wholesalers
    ```
*   **Finance Context (`get_finance_db_context`)**: Aggregates `data/transactions.csv` to feed:
    ```text
    - Total Revenue (Sales) sum.
    - Total Expenses sum.
    - Net Profit calculations.
    - Breakdown of Category and Payment Modes totals.
    - Recent list of top 5 highest expenses (spikes).
    ```
*   **Analytics Context (`get_analytics_db_context`)**: Queries Scikit-learn model outputs:
    ```text
    - 30-Day Total predicted sales sum.
    - Linear regression growth trajectory trend percentage.
    - Five-day daily forecast sample metrics.
    ```

---

## 4. LLM API Configurations & Fallback Routines

### Active LLM Calls
The system initiates LLM completion calls using the configured providers:
1.  **Gemini API**: Connects via `google-generativeai` and sets up a `GenerativeModel` targeting `gemini-1.5-flash`, initializing the model with the agent's unique system instructions.
2.  **Groq API**: Connects via an HTTP payload post request to `https://api.groq.com/openai/v1/chat/completions` executing on `llama-3.3-70b-versatile` with system instruction dictionary mappings.
*   *Failover Routing*: If Gemini fails, it attempts Groq; if Groq fails, it tries Gemini. If both fail or are missing API keys, it invokes the local fallback agent.

### Local Fallback Logic (`fallback_local_agent`)
When offline or if no API keys are present, the system runs local, data-driven fallback calculations:
*   **Regex Keyword Routing**: Scans the query text (e.g., matching "stock"/"low" to `INVENTORY`, matching "forecast"/"future" to `ANALYTICS`).
*   **Local Ingestion Engine**:
    *   *Finance Request*: Evaluates Pandas dataframes directly, calculates sales sums, subtracts expenses, groups revenue splits, and outputs a formatted markdown financial sheet.
    *   *Inventory Request*: Iterates over Pandas rows, filters stock levels less than reorder limits, and lists items with their real names and suppliers.
    *   *Analytics Request*: Evaluates time-series growth margins, fetches the linear regression sums from the predictor engine, and prints warnings.
*   **Bilingual Translation**: Utilizes keyword lists to trigger Tamil localized outputs directly from Python dictionary templates.
