import os
from forecasting.predictor import predict_inventory_exhaustion
from agents.coordinator import coordinate_agents
from whatsapp.twilio_bot import send_whatsapp_message

def trigger_low_stock_local(custom_recipient: str = None) -> dict:
    """Runs low-stock alert logic directly within Python process (offline fallback)."""
    try:
        depletion = predict_inventory_exhaustion()
        low_stock_items = [item for item in depletion if item["Status"] == "Low Stock"]
        
        if not low_stock_items:
            return {
                "success": True, 
                "alert_sent": False, 
                "message": "All stock levels are currently healthy. No alerts triggered."
            }
            
        alerts_sent = []
        for item in low_stock_items:
            alert_query = (
                f"Draft a short, urgent low stock WhatsApp alert notification for this product: "
                f"{item['ProductName']} (ID: {item['ProductID']}). "
                f"Current Stock: {item['CurrentStock']} units. Reorder limit: {item['ReorderLevel']}. "
                f"We are selling {item['DailyVelocity']} units per day, and will run out in {item['DaysRemaining']} days. "
                f"Supplier is {item['Supplier']}. Recommend restocking {item['ReorderRecommendation']} units."
            )
            
            context = f"Product details: {str(item)}"
            agent_result = coordinate_agents(alert_query, context)
            alert_draft = agent_result["response"]
            
            send_result = send_whatsapp_message(alert_draft, to_number=custom_recipient)
            alerts_sent.append(send_result)
            
        return {
            "success": True,
            "alert_sent": True,
            "count": len(alerts_sent),
            "alerts": alerts_sent
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
