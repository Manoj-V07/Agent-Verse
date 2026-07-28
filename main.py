import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import config
import pandas as pd
from rag.retriever import index_file, retrieve_context
from agents.coordinator import coordinate_agents
from forecasting.predictor import forecast_sales, predict_inventory_exhaustion
from whatsapp.twilio_bot import send_whatsapp_message, get_whatsapp_logs, clear_whatsapp_logs, log_whatsapp_message

# Initialize FastAPI App
app = FastAPI(title="AegisAI API", description="Backend services for Multilingual SME Autonomous Copilot")

# Enable CORS for Streamlit frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ChatRequest(BaseModel):
    query: str
    use_rag: bool = True
    provider: str = "gemini"

class AlertRequest(BaseModel):
    custom_recipient: str = None
    provider: str = "gemini"

class ProductAddRequest(BaseModel):
    ProductID: str
    ProductName: str
    Category: str
    StockLevel: int
    ReorderLevel: int
    UnitPrice: float
    RetailPrice: float
    Supplier: str

# Endpoints
@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to AegisAI SME Copilot Backend"}

@app.post("/api/chat")
async def chat(req: ChatRequest):
    """
    Core Chat Endpoint. Retrieves document context (if RAG is enabled)
    and routes the query through the multi-agent coordinator.
    """
    context = ""
    if req.use_rag:
        try:
            # Fetch relevant document snippets
            context = retrieve_context(req.query, k=3)
        except Exception as e:
            print(f"RAG retrieval failed: {e}")
            context = "Unable to retrieve document context."
            
    try:
        # Route query through multi-agent system
        result = coordinate_agents(req.query, context, provider=req.provider)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent coordination error: {str(e)}")

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Document Upload Endpoint. Receives invoices, spreadsheets, images,
    or voice notes, saves them, and indexes them in the Vector Store.
    """
    # Ensure uploads folder exists
    os.makedirs(config.UPLOAD_DIR, exist_ok=True)
    
    file_path = os.path.join(config.UPLOAD_DIR, file.filename)
    try:
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run OCR / Transcription and index in Vector Database
        index_result = index_file(file_path)
        return {"success": True, "message": index_result, "filename": file.filename}
    except Exception as e:
        # Cleanup file if saved but indexing failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")

@app.get("/api/forecast")
def get_forecast(product_id: str = Query(None), days: int = Query(30)):
    """Triggers the ML forecasting engine and returns time-series predictions."""
    try:
        results = forecast_sales(product_id=product_id, days_ahead=days)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@app.get("/api/inventory/depletion")
def get_depletion():
    """Computes daily sales rate, current stock status, and predicted exhaustion dates."""
    try:
        exhaustion_data = predict_inventory_exhaustion()
        return exhaustion_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory depletion calculation error: {str(e)}")

@app.post("/api/inventory/add")
def add_inventory_product(req: ProductAddRequest):
    """Appends a new product to inventory.csv database."""
    try:
        from forecasting.predictor import INVENTORY_PATH
        # Check if file exists, if so read it
        if os.path.exists(INVENTORY_PATH):
            df = pd.read_csv(INVENTORY_PATH)
        else:
            df = pd.DataFrame(columns=["ProductID", "ProductName", "Category", "StockLevel", "ReorderLevel", "UnitPrice", "RetailPrice", "Supplier"])
            
        # Check if ProductID already exists
        if req.ProductID in df["ProductID"].values:
            raise HTTPException(status_code=400, detail=f"Product with ID {req.ProductID} already exists.")
            
        # Add new row
        new_row = {
            "ProductID": req.ProductID,
            "ProductName": req.ProductName,
            "Category": req.Category,
            "StockLevel": req.StockLevel,
            "ReorderLevel": req.ReorderLevel,
            "UnitPrice": req.UnitPrice,
            "RetailPrice": req.RetailPrice,
            "Supplier": req.Supplier
        }
        # Use pandas concat or loc
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        df.to_csv(INVENTORY_PATH, index=False)
        return {"success": True, "message": f"Product {req.ProductName} successfully added to inventory."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add product: {str(e)}")

@app.post("/api/alerts/trigger-low-stock")
def trigger_low_stock_alerts(req: AlertRequest = None):
    """
    Low Stock Check & Alert Trigger.
    Queries stock status, identifies items that need reordering, drafts
    alert texts, and sends them via real Twilio or local simulator.
    """
    try:
        # Get depletion calculations
        depletion = predict_inventory_exhaustion()
        low_stock_items = [item for item in depletion if item["Status"] == "Low Stock"]
        
        if not low_stock_items:
            return {"success": True, "alert_sent": False, "message": "All stock levels are currently healthy. No alerts triggered."}
            
        alerts_sent = []
        recipient = req.custom_recipient if req else None
        provider = req.provider if req else "gemini"
        
        for item in low_stock_items:
            # Build query for Communication Agent to draft alert
            alert_query = (
                f"Draft a short, urgent low stock WhatsApp alert notification for this product: "
                f"{item['ProductName']} (ID: {item['ProductID']}). "
                f"Current Stock: {item['CurrentStock']} units. Reorder limit: {item['ReorderLevel']}. "
                f"We are selling {item['DailyVelocity']} units per day, and will run out in {item['DaysRemaining']} days. "
                f"Supplier is {item['Supplier']}. Recommend restocking {item['ReorderRecommendation']} units."
            )
            
            # Form context
            context = f"Product details: {str(item)}"
            
            # Invoke Communication Agent
            agent_result = coordinate_agents(alert_query, context, provider=provider)
            alert_draft = agent_result["response"]
            
            # Send message
            send_result = send_whatsapp_message(alert_draft, to_number=recipient)
            alerts_sent.append(send_result)
            
        return {
            "success": True,
            "alert_sent": True,
            "count": len(alerts_sent),
            "alerts": alerts_sent
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alert dispatch error: {str(e)}")

@app.get("/api/whatsapp/logs")
def get_message_logs():
    """Returns the message history (real or simulated) for dashboard visualization."""
    return get_whatsapp_logs()

@app.post("/api/whatsapp/clear")
def clear_message_logs():
    """Wipes the local WhatsApp mock logs."""
    clear_whatsapp_logs()
    return {"success": True, "message": "Logs cleared."}

@app.post("/api/whatsapp/webhook")
async def twilio_webhook(From: str = Form(...), Body: str = Form(...)):
    """
    Twilio Webhook Handler.
    Receives incoming WhatsApp texts from the SME owner, queries the agent,
    and returns a TwiML response to text back the result.
    """
    clean_sender = From.replace("whatsapp:", "")
    print(f"Incoming WhatsApp message from {clean_sender}: '{Body}'")
    
    # 1. Retrieve context
    context = ""
    try:
        context = retrieve_context(Body, k=3)
    except Exception as e:
        print(f"Webhook RAG failed: {e}")
        
    # 2. Query Agent
    try:
        agent_result = coordinate_agents(Body, context)
        reply_body = agent_result["response"]
    except Exception as e:
        reply_body = f"Sorry, I encountered an error processing your query: {str(e)}"
        
    # Log the incoming message in our simulated log for dashboard visibility
    log_whatsapp_message(From, f"Merchant asked: {Body}", "Received")
    send_whatsapp_message(reply_body, to_number=From)
    
    # Return TwiML response to Twilio (which automatically text backs the user)
    # Twilio expects XML responses
    from fastapi.responses import Response
    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Message>{reply_body}</Message>
    </Response>"""
    
    return Response(content=twiml_response, media_type="application/xml")
