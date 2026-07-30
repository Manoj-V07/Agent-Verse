import os
import re
import pandas as pd
from datetime import datetime
from agents.base_agent import call_llm
from forecasting.customer_analytics import get_customer_insights

CUSTOMER_SYSTEM_INSTRUCTION = (
    "You are the Customer Insights Agent of AegisAI, a business copilot for Indian SMEs. "
    "Your role is to analyze customer buying behavior, customer lifetime value, average order value, purchase frequency, "
    "and customer segments (VIP, Regular, Occasional, New, Inactive). "
    "When answering questions, focus on: "
    "- Providing high-value customer details (who spends the most, who buys most frequently). "
    "- Identifying inactive or churn-risk customers and suggesting re-engagement campaigns. "
    "- Recommending cross-selling, upselling, or bundle offers based on frequently bought together items. "
    "- Explaining metrics like AOV, CLV, and repeat purchase rate in simple terms. "
    "Format data in neat markdown tables, bullet points, and highlight monetary values in Indian Rupees (₹ or Rs.). "
    "Support Tamil translation/responses if requested or if the query is in Tamil."
)

def run_customer_agent(query: str, context: str, provider: str = "gemini") -> str:
    """Invokes the Customer Agent to analyze customer queries in the context."""
    prompt = f"RAG & Database Context:\n{context}\n\nUser Question: {query}"
    return call_llm(CUSTOMER_SYSTEM_INSTRUCTION, prompt, provider=provider)

def fallback_customer_agent(query: str, workspace_dir: str = None) -> str:
    """
    A local offline fallback implementation for the Customer Insights Agent.
    It reads transactions and customer records directly to compute precise,
    live answers for standard customer questions.
    """
    insights = get_customer_insights(workspace_dir)
    query_lower = query.lower()
    
    # Check language
    is_tamil = any(word in query_lower for word in ["வணக்கம்", "விற்பனை", "வாடிக்கையாளர்", "முக்கிய", "அடிக்கடி", "மதிப்பு"])
    
    # 1. Who are my top 10 customers?
    if any(k in query_lower for k in ["top 10", "top ten", "best customer", "highest spenders", "சிறந்த", "முக்கியமான"]):
        custs = insights["customers"][:10]
        if not custs:
            return "No customer profiles found in database." if not is_tamil else "வாடிக்கையாளர் விவரங்கள் எதுவும் இல்லை."
            
        lines = []
        if is_tamil:
            lines.append("### 🏆 உங்கள் சிறந்த 10 வாடிக்கையாளர்கள் (விற்பனை அடிப்படையில்):")
            lines.append("| பெயர் | மொபைல் | மொத்த செலவு | வருகைகள் | கடைசி கொள்முதல் | பிரிவு |")
            lines.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
            for c in custs:
                lines.append(f"| {c['name']} | {c['phone']} | Rs. {c['spending']:,.2f} | {c['visits']} முறை | {c['last_purchase']} | **{c['segment']}** |")
        else:
            lines.append("### 🏆 Your Top Customers (By Total Spend):")
            lines.append("| Name | Phone | Total Spend | Visits | Last Purchase | Segment |")
            lines.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
            for c in custs:
                lines.append(f"| {c['name']} | {c['phone']} | Rs. {c['spending']:,.2f} | {c['visits']} | {c['last_purchase']} | **{c['segment']}** |")
        return "\n".join(lines)
        
    # 2. Which customers haven't purchased in the last 60 days?
    elif any(k in query_lower for k in ["haven't purchased", "no purchase", "inactive", "last 60 days", "not purchased", "வராத", "வாங்காத"]):
        inactive_custs = [c for c in insights["customers"] if c["segment"] == "Inactive" or c["days_since_last"] > 60]
        if not inactive_custs:
            return "All of your registered customers have purchased within the last 60 days!" if not is_tamil else "அனைத்து வாடிக்கையாளர்களும் கடந்த 60 நாட்களில் கொள்முதல் செய்துள்ளனர்!"
            
        lines = []
        if is_tamil:
            lines.append("### ⚠️ கடந்த 60 நாட்களாக வாங்காத வாடிக்கையாளர்கள்:")
            lines.append("| பெயர் | தொடர்பு | கடைசி கொள்முதல் | நாட்கள் | பிரிவு |")
            lines.append("| :--- | :--- | :--- | :--- | :--- |")
            for c in inactive_custs:
                lines.append(f"| {c['name']} | {c['phone']} | {c['last_purchase']} | {c['days_since_last']} நாட்கள் | {c['segment']} |")
        else:
            lines.append("### ⚠️ Customers Inactive for 60+ Days:")
            lines.append("| Name | Contact | Last Purchase | Days Inactive | Segment |")
            lines.append("| :--- | :--- | :--- | :--- | :--- |")
            for c in inactive_custs:
                lines.append(f"| {c['name']} | {c['phone']} | {c['last_purchase']} | {c['days_since_last']} | {c['segment']} |")
        return "\n".join(lines)
        
    # 3. Which products are commonly bought together?
    elif any(k in query_lower for k in ["bought together", "commonly bought", "bundle", "frequently bought", "சேர்த்து", "கூட்டாக"]):
        fbt = insights["frequently_bought_together"]
        if not fbt:
            return "No strong co-purchase patterns detected yet. Log more multi-item checkouts to discover trends!" if not is_tamil else "கூட்டு கொள்முதல் தரவு இன்னும் கண்டறியப்படவில்லை."
            
        lines = []
        if is_tamil:
            lines.append("### 🤝 பொதுவாக ஒன்றாக வாங்கப்படும் பொருட்கள் (Frequently Bought Together):")
            for item in fbt:
                lines.append(f"- **{item['product_a']}** மற்றும் **{item['product_b']}** (கூட்டு கொள்முதல்: {item['co_occurrence']} முறை | ஆதரவு: {item['support_percentage']}%)")
        else:
            lines.append("### 🤝 Products Frequently Bought Together:")
            for item in fbt:
                lines.append(f"- **{item['product_a']}** & **{item['product_b']}** (Bought together {item['co_occurrence']} times | Support: {item['support_percentage']}%)")
        return "\n".join(lines)
        
    # 4. Who spends the most every month?
    elif any(k in query_lower for k in ["spends the most every month", "spend the most every month", "monthly spenders", "monthly top spenders", "மாதாந்திர"]):
        # Load transactions directly to perform grouped calculations
        tx_path = os.path.join(workspace_dir, "transactions.csv") if workspace_dir else ""
        if not tx_path or not os.path.exists(tx_path):
            return "Transactions database not found."
            
        df = pd.read_csv(tx_path)
        sales = df[(df['Type'] == 'Sale') & (df['CustomerID'].notna())].copy()
        if sales.empty:
            return "No transaction history available."
            
        sales['Date'] = pd.to_datetime(sales['Date'])
        sales['Month'] = sales['Date'].dt.strftime('%B %Y')
        sales['YearMonth'] = sales['Date'].dt.to_period('M')
        
        # Group by Month and Customer
        grouped = sales.groupby(['YearMonth', 'Month', 'CustomerID', 'CustomerName'])['Amount'].sum().reset_index()
        
        # For each YearMonth, find index of max Amount
        top_spenders = []
        for ym in grouped['YearMonth'].unique():
            month_data = grouped[grouped['YearMonth'] == ym]
            idx_max = month_data['Amount'].idxmax()
            top_spenders.append(month_data.loc[idx_max].to_dict())
            
        top_spenders.sort(key=lambda x: x['YearMonth'], reverse=True)
        
        lines = []
        if is_tamil:
            lines.append("### 📅 மாத வாரியாக அதிக தொகை செலவழித்த வாடிக்கையாளர்கள்:")
            lines.append("| மாதம் | சிறந்த வாடிக்கையாளர் (ID) | செலவழித்த தொகை |")
            lines.append("| :--- | :--- | :--- |")
            for ts in top_spenders:
                lines.append(f"| {ts['Month']} | {ts['CustomerName']} ({ts['CustomerID']}) | Rs. {ts['Amount']:,.2f} |")
        else:
            lines.append("### 📅 Monthly Top Spenders:")
            lines.append("| Month | Top Spending Customer (ID) | Total Month Spend |")
            lines.append("| :--- | :--- | :--- |")
            for ts in top_spenders:
                lines.append(f"| {ts['Month']} | {ts['CustomerName']} ({ts['CustomerID']}) | Rs. {ts['Amount']:,.2f} |")
        return "\n".join(lines)
        
    # 5. Which customers should receive a promotional offer?
    elif any(k in query_lower for k in ["promotional offer", "promotion", "promo", "coupon", "discount", "சலுகை", "தள்ளுபடி"]):
        recs = insights["recommendations"]
        if not recs:
            return "No active promotion recommendations. All customer channels are stable." if not is_tamil else "விற்பனை சலுகை பரிந்துரைகள் எதுவும் இல்லை."
            
        lines = []
        if is_tamil:
            lines.append("### 🎁 சலுகை வழங்க பரிந்துரைக்கப்படும் வாடிக்கையாளர்கள்:")
            for r in recs:
                lines.append(f"- **{r['title']}** (மொபைல்: {r['customer_phone']})\n  - *காரணம்:* {r['message']}\n  - *பரிந்துரை:* {r['suggested_action']} ({r['discount_offer']})")
        else:
            lines.append("### 🎁 Customers Recommended for Promotional Campaigns:")
            for r in recs:
                lines.append(f"- **{r['title']}** (Phone: {r['customer_phone']})\n  - *Reason:* {r['message']}\n  - *Action:* {r['suggested_action']} ({r['discount_offer']})")
        return "\n".join(lines)
        
    # 6. What is the average order value this month?
    elif any(k in query_lower for k in ["average order value", "aov", "average sale", "order value", "சராசரி ஆர்டர் மதிப்பு"]):
        tx_path = os.path.join(workspace_dir, "transactions.csv") if workspace_dir else ""
        if not tx_path or not os.path.exists(tx_path):
            return "Transactions database not found."
        df = pd.read_csv(tx_path)
        sales = df[df['Type'] == 'Sale'].copy()
        if sales.empty:
            return "No transaction history available."
            
        sales['Date'] = pd.to_datetime(sales['Date'])
        curr_month = datetime.now().strftime('%Y-%m')
        sales['Month'] = sales['Date'].dt.strftime('%Y-%m')
        
        month_sales = sales[sales['Month'] == curr_month]
        if month_sales.empty:
            # Fallback to general AOV
            all_aov = sales.groupby('TransactionID')['Amount'].sum().mean()
            return f"No sales logged yet this month. The historical Average Order Value (AOV) is **Rs. {all_aov:,.2f}**."
            
        month_aov = month_sales.groupby('TransactionID')['Amount'].sum().mean()
        if is_tamil:
            return f"இந்த மாதத்தின் சராசரி ஆர்டர் மதிப்பு (Average Order Value - AOV) **Rs. {month_aov:,.2f}** ஆகும்."
        return f"The Average Order Value (AOV) for this month is **Rs. {month_aov:,.2f}**."
        
    # 7. How many repeat customers do I have?
    elif any(k in query_lower for k in ["repeat customer", "repeat buyer", "returning customer", "திரும்பிய வாடிக்கையாளர்"]):
        metrics = insights["metrics"]
        total = metrics["total_customers"]
        rate = metrics["repeat_customer_rate"]
        
        # Calculate count
        custs = insights["customers"]
        repeat_count = sum(1 for c in custs if c["visits"] >= 2)
        
        if is_tamil:
            return (
                f"### 👥 திரும்பிய வாடிக்கையாளர்கள் (Repeat Customers):\n"
                f"- திரும்பிய வாடிக்கையாளர்களின் எண்ணிக்கை: **{repeat_count}** (மொத்தம் {total}-இல்)\n"
                f"- வாடிக்கையாளர் தக்கவைப்பு விகிதம் (Repeat Customer Rate): **{rate}%**"
            )
        return (
            f"### 👥 Repeat Buyers Summary:\n"
            f"- Total Repeat Customers: **{repeat_count}** (out of {total} registered customers)\n"
            f"- Repeat Purchase Rate: **{rate}%**"
        )
        
    # General greeting/fallback for Customer insights
    else:
        metrics = insights["metrics"]
        if is_tamil:
            return (
                f"### 👥 வாடிக்கையாளர் நுண்ணறிவு (ஆஃப்லைன் முகவர்)\n"
                f"உங்கள் வாடிக்கையாளர் விவரங்களின் சுருக்கம்:\n"
                f"- **மொத்த வாடிக்கையாளர்கள்:** {metrics['total_customers']}\n"
                f"- **செயலில் உள்ளவர்கள் (Active):** {metrics['active_customers']}\n"
                f"- **செயலற்றவர்கள் (Inactive):** {metrics['inactive_customers']}\n"
                f"- **சராசரி ஆர்டர் மதிப்பு:** Rs. {metrics['average_order_value']:,.2f}\n"
                f"- **மீண்டும் கொள்முதல் செய்தவர்கள்:** {metrics['repeat_customer_rate']}%\n\n"
                f"மேலும் அறிய வாடிக்கையாளர் கேள்விகளைக் கேளுங்கள், எ.கா. *'Who are my top 10 customers?'*"
            )
        else:
            return (
                f"### 👥 Customer Insights (Offline Customer Agent)\n"
                f"Here is a summary of your customer records:\n"
                f"- **Total Registered Customers:** {metrics['total_customers']}\n"
                f"- **Active Buyers (Last 60 days):** {metrics['active_customers']}\n"
                f"- **Inactive Buyers (60+ days):** {metrics['inactive_customers']}\n"
                f"- **Average Order Value (AOV):** Rs. {metrics['average_order_value']:,.2f}\n"
                f"- **Repeat Customer Rate:** {metrics['repeat_customer_rate']}%\n\n"
                f"Try asking customer-specific questions like: *'Who spends the most every month?'* or *'Which products are commonly bought together?'*"
            )
