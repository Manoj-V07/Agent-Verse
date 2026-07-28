import os
import sys
import pandas as pd

# Add the current folder to sys.path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("=== AEGISAI SYSTEM VERIFICATION ===")

# 1. Check Directories and Files
print("\n[1/7] Checking file system paths...")
tx_path = 'data/transactions.csv'
inv_path = 'data/inventory.csv'

if os.path.exists(tx_path) and os.path.exists(inv_path):
    print("[OK] Database CSV files found.")
    df_tx = pd.read_csv(tx_path)
    df_inv = pd.read_csv(inv_path)
    print(f"   - Transactions: {len(df_tx)} rows loaded.")
    print(f"   - Inventory: {len(df_inv)} items loaded.")
else:
    print("[ERROR] CSV files missing! Run generate_mock_data.py first.")
    sys.exit(1)

# 2. Check Embeddings Pipeline
print("\n[2/7] Testing Embeddings generator...")
try:
    from rag.embeddings import get_embedding
    vector = get_embedding("AegisAI premium chatbot system")
    if isinstance(vector, list) and len(vector) == 768:
        print("[OK] Embeddings pipeline operational. Generated 768-dim vector.")
    else:
        print(f"[ERROR] Invalid vector generated (type: {type(vector)}, len: {len(vector) if isinstance(vector, list) else 'N/A'})")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Embeddings failure: {e}")
    sys.exit(1)

# 3. Check Vector Store and Retriever
print("\n[3/7] Ingesting and retrieving sample document...")
try:
    from rag.retriever import index_file, retrieve_context
    # Create a small scratch test file
    test_file = 'data/test_memo.txt'
    with open(test_file, 'w', encoding='utf-8') as f:
        f.write("AegisAI specializes in Indian SME bookkeeping. Sri Balaji Traders is located in Chennai and supplies basmati rice.")
        
    index_msg = index_file(test_file)
    print(f"   - Ingestion output: {index_msg}")
    
    # Try retrieving it
    context = retrieve_context("Who supplies rice and where are they?")
    if "Sri Balaji Traders" in context:
        print("[OK] Vector search & retrieval successful.")
    else:
        print(f"[ERROR] Retrieval failed to find relevant context. Found context: {context}")
        sys.exit(1)
        
    # Cleanup test memo
    if os.path.exists(test_file):
        os.remove(test_file)
except Exception as e:
    print(f"[ERROR] Vector search/retrieval failure: {e}")
    sys.exit(1)

# 4. Check Forecasting Engine
print("\n[4/7] Testing Machine Learning forecasting...")
try:
    from forecasting.predictor import forecast_sales, predict_inventory_exhaustion
    res_forecast = forecast_sales(product_id=None, days_ahead=30)
    if "forecast" in res_forecast and len(res_forecast["forecast"]["sales"]) == 30:
        print(f"[OK] ML Sales Forecasting engine operational. Predicted 30-day sales sum: Rs. {res_forecast['total_forecasted_sales']:,.2f}")
    else:
        print("[ERROR] Forecasting output incorrect.")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Forecasting failure: {e}")
    sys.exit(1)

# 5. Check Inventory Depletion Rates
print("\n[5/7] Testing inventory velocity depletion metrics...")
try:
    dep_list = predict_inventory_exhaustion()
    if dep_list and len(dep_list) > 0:
        low_items = [i for i in dep_list if i["Status"] == "Low Stock"]
        print(f"[OK] Inventory velocity calculated. Found {len(low_items)} low stock warnings.")
        for item in dep_list[:2]:
            print(f"   - Item: {item['ProductName']} | Days Remaining: {item['DaysRemaining']} | Status: {item['Status']}")
    else:
        print("[ERROR] Inventory exhaustion calculations returned empty list.")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Stock velocity failure: {e}")
    sys.exit(1)

# 6. Check WhatsApp Simulator logs
print("\n[6/7] Testing Twilio & simulated messaging...")
try:
    from whatsapp.twilio_bot import send_whatsapp_message, get_whatsapp_logs
    test_msg = "🚨 SYSTEM TEST: Low stock for Sunflower Oil."
    # Filter/escape emoji from logs printout if we want to be safe, but the console print is where it fails. We'll send standard ASCII message
    test_msg = "SYSTEM TEST: Low stock for Sunflower Oil."
    res_send = send_whatsapp_message(test_msg)
    
    logs = get_whatsapp_logs()
    if logs and logs[-1]["body"] == test_msg:
        print("[OK] Twilio message simulator verified. Test logged.")
    else:
        print("[ERROR] Simulated alert logging failed.")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Messaging simulator failure: {e}")
    sys.exit(1)

# 7. Check Multi-Agent Routing & Coordination
print("\n[7/7] Testing Multi-Agent Coordinator routing...")
try:
    from agents.coordinator import coordinate_agents
    coord_result = coordinate_agents("Will stock level of basmati rice run out soon?", "Product details: Premium Basmati Rice stock: 45 units")
    print(f"   - Routed Agent: {coord_result['agent']}")
    print(f"   - Routing Reasoning: {coord_result['reasoning']}")
    print(f"   - Coordinator Thoughts: {coord_result['thoughts']}")
    if coord_result["agent"] in ["INVENTORY", "GENERAL"]:
        print("[OK] Multi-Agent Coordinator routing validated.")
    else:
        print(f"[ERROR] Coordinator routed query incorrectly: {coord_result['agent']}")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Multi-Agent coordination failure: {e}")
    sys.exit(1)

print("\n[SUCCESS] ALL AEGISAI MODULE INTEGRATIONS VERIFIED SUCCESSFULLY! SYSTEM READY.")
