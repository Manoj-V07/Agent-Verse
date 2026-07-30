import os
import shutil
import json
import uuid
import hashlib
import base64
import math
from datetime import datetime, timedelta
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import config
import pandas as pd
from rag.retriever import index_file, retrieve_context
from agents.coordinator import coordinate_agents
from forecasting.predictor import forecast_sales, predict_inventory_exhaustion
from forecasting.customer_analytics import initialize_customers_and_transactions, get_customer_insights
from whatsapp.twilio_bot import send_whatsapp_message, get_whatsapp_logs, clear_whatsapp_logs, log_whatsapp_message

# Initialize FastAPI App
app = FastAPI(title="AegisAI API", description="Backend services for Multilingual SME Autonomous Copilot")

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Paths
USERS_DB_PATH = os.path.join(config.DATA_DIR, "users.json")
SESSIONS_DB_PATH = os.path.join(config.DATA_DIR, "sessions.json")

# Hashing & Salt functions
def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if salt is None:
        salt = os.urandom(16).hex()
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pwd_hash, salt

# DB Helper functions
def load_users() -> dict:
    if not os.path.exists(USERS_DB_PATH):
        return {}
    try:
        with open(USERS_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_users(users: dict):
    with open(USERS_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=4)

def load_sessions() -> dict:
    if not os.path.exists(SESSIONS_DB_PATH):
        return {}
    try:
        with open(SESSIONS_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_sessions(sessions: dict):
    with open(SESSIONS_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(sessions, f, indent=4)

# Data Importers & Mappers
def parse_uploaded_file(file: UploadFile) -> pd.DataFrame:
    ext = os.path.splitext(file.filename)[1].lower()
    if ext == '.csv':
        return pd.read_csv(file.file)
    elif ext in ['.xlsx', '.xls']:
        return pd.read_excel(file.file)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")

def map_and_save_products(df: pd.DataFrame, output_path: str):
    expected_cols = ["ProductID", "ProductName", "Category", "StockLevel", "ReorderLevel", "UnitPrice", "RetailPrice", "Supplier"]
    mapped_df = pd.DataFrame()
    df_cols_lower = {col.lower().replace(" ", "").replace("_", ""): col for col in df.columns}
    
    for target in expected_cols:
        target_clean = target.lower()
        if target_clean in df_cols_lower:
            mapped_df[target] = df[df_cols_lower[target_clean]]
        else:
            if target in ["StockLevel", "ReorderLevel"]:
                mapped_df[target] = 0
            elif target in ["UnitPrice", "RetailPrice"]:
                mapped_df[target] = 0.0
            else:
                mapped_df[target] = "Unknown"
                
    mapped_df.to_csv(output_path, index=False)

def map_and_save_transactions(df: pd.DataFrame, output_path: str):
    expected_cols = ["Date", "TransactionID", "CustomerID", "CustomerName", "ProductID", "ProductName", "Category", "Quantity", "Price", "Type", "Amount", "PaymentMode"]
    mapped_df = pd.DataFrame()
    df_cols_lower = {col.lower().replace(" ", "").replace("_", ""): col for col in df.columns}
    
    for target in expected_cols:
        target_clean = target.lower()
        if target_clean in df_cols_lower:
            mapped_df[target] = df[df_cols_lower[target_clean]]
        else:
            if target == "Date":
                mapped_df[target] = datetime.now().strftime("%Y-%m-%d")
            elif target == "Quantity":
                mapped_df[target] = 1
            elif target in ["Price", "Amount"]:
                mapped_df[target] = 0.0
            elif target == "Type":
                mapped_df[target] = "Sale"
            elif target == "PaymentMode":
                mapped_df[target] = "Cash"
            elif target in ["CustomerID", "CustomerName"]:
                mapped_df[target] = ""
            else:
                mapped_df[target] = "Unknown"
                
    mapped_df.to_csv(output_path, index=False)

def initialize_empty_workspace(workspace_dir: str):
    inv_path = os.path.join(workspace_dir, "inventory.csv")
    tx_path = os.path.join(workspace_dir, "transactions.csv")
    
    inv_cols = ["ProductID", "ProductName", "Category", "StockLevel", "ReorderLevel", "UnitPrice", "RetailPrice", "Supplier"]
    tx_cols = ["Date", "TransactionID", "CustomerID", "CustomerName", "ProductID", "ProductName", "Category", "Quantity", "Price", "Type", "Amount", "PaymentMode"]
    
    pd.DataFrame(columns=inv_cols).to_csv(inv_path, index=False)
    pd.DataFrame(columns=tx_cols).to_csv(tx_path, index=False)
    
    initialize_default_suppliers(workspace_dir)
    
    # Initialize customer registry and rich mock sales context
    initialize_customers_and_transactions(workspace_dir)

# --- SUPPLIER & PROCUREMENT HELPERS ---

def initialize_default_suppliers(workspace_dir: str):
    suppliers_path = os.path.join(workspace_dir, "suppliers.json")
    po_path = os.path.join(workspace_dir, "purchase_orders.json")
    
    # Initialize empty POs
    if not os.path.exists(po_path):
        with open(po_path, "w", encoding="utf-8") as f:
            json.dump([], f)
            
    # Default suppliers database
    if not os.path.exists(suppliers_path):
        default_sups = [
            {
                "id": "S101",
                "name": "Sri Balaji Traders",
                "phone": "+919876543211",
                "email": "balaji@traders.com",
                "reliability": 95,
                "payment_terms": "Net 15",
                "catalog": [
                    {"product_id": "P101", "unit_price": 350.0, "min_order_qty": 10, "lead_time_days": 3},
                    {"product_id": "P104", "unit_price": 220.0, "min_order_qty": 15, "lead_time_days": 4}
                ]
            },
            {
                "id": "S102",
                "name": "Vignesh Wholesalers",
                "phone": "+919876543212",
                "email": "vignesh@wholesalers.com",
                "reliability": 88,
                "payment_terms": "COD",
                "catalog": [
                    {"product_id": "P102", "unit_price": 110.0, "min_order_qty": 20, "lead_time_days": 2},
                    {"product_id": "P107", "unit_price": 95.0, "min_order_qty": 10, "lead_time_days": 5},
                    {"product_id": "P108", "unit_price": 115.0, "min_order_qty": 12, "lead_time_days": 3}
                ]
            },
            {
                "id": "S103",
                "name": "Tirupur Distributors",
                "phone": "+919876543213",
                "email": "tirupur@distributors.com",
                "reliability": 91,
                "payment_terms": "Net 30",
                "catalog": [
                    {"product_id": "P103", "unit_price": 20.0, "min_order_qty": 30, "lead_time_days": 6},
                    {"product_id": "P106", "unit_price": 12.0, "min_order_qty": 50, "lead_time_days": 2},
                    {"product_id": "P109", "unit_price": 20.0, "min_order_qty": 25, "lead_time_days": 3}
                ]
            },
            {
                "id": "S104",
                "name": "Raja Pulses",
                "phone": "+919876543214",
                "email": "raja@pulses.com",
                "reliability": 84,
                "payment_terms": "UPI",
                "catalog": [
                    {"product_id": "P105", "unit_price": 140.0, "min_order_qty": 10, "lead_time_days": 7}
                ]
            }
        ]
        with open(suppliers_path, "w", encoding="utf-8") as f:
            json.dump(default_sups, f, indent=4)

def sync_product_with_supplier(workspace_dir: str, product_id: str, unit_price: float, supplier_name: str):
    if not supplier_name or not isinstance(supplier_name, str) or supplier_name.strip() == "" or supplier_name == "Unknown":
        return
        
    suppliers_path = os.path.join(workspace_dir, "suppliers.json")
    if not os.path.exists(suppliers_path):
        initialize_default_suppliers(workspace_dir)
        
    try:
        with open(suppliers_path, "r", encoding="utf-8") as f:
            suppliers = json.load(f)
    except Exception:
        suppliers = []
        
    target_sup = None
    for s in suppliers:
        if s["name"].lower() == supplier_name.lower():
            target_sup = s
            break
            
    if not target_sup:
        sup_id = f"S{100 + len(suppliers) + 1}"
        phone = f"+9198765{10000 + len(suppliers)}"
        target_sup = {
            "id": sup_id,
            "name": supplier_name,
            "phone": phone,
            "email": f"{supplier_name.lower().replace(' ', '')}@wholesaler.com",
            "reliability": 85,
            "payment_terms": "COD",
            "catalog": []
        }
        suppliers.append(target_sup)
        
    # Verify product catalog entry
    catalog = target_sup["catalog"]
    product_in_catalog = False
    for item in catalog:
        if item["product_id"] == product_id:
            item["unit_price"] = unit_price
            product_in_catalog = True
            break
            
    if not product_in_catalog:
        catalog.append({
            "product_id": product_id,
            "unit_price": unit_price,
            "min_order_qty": 10,
            "lead_time_days": 3
        })
        
    with open(suppliers_path, "w", encoding="utf-8") as f:
        json.dump(suppliers, f, indent=4)

# Security Dependency
def get_current_user_workspace_info(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized - Missing or invalid token format")
    token = authorization.split(" ")[1]
    
    sessions = load_sessions()
    email = sessions.get(token)
    if not email:
        raise HTTPException(status_code=401, detail="Session expired")
        
    users = load_users()
    user_record = users.get(email)
    if not user_record:
        raise HTTPException(status_code=401, detail="User not found")
        
    workspace_id = user_record.get("workspace_id")
    if not workspace_id:
        workspace_id = str(uuid.uuid4())
        user_record["workspace_id"] = workspace_id
        save_users(users)
        
    workspace_dir = os.path.join(config.WORKSPACES_DIR, workspace_id)
    os.makedirs(workspace_dir, exist_ok=True)
    
    # Check databases exist
    initialize_default_suppliers(workspace_dir)
    initialize_customers_and_transactions(workspace_dir)
    
    # Read onboarding status and details
    onboarding_file = os.path.join(workspace_dir, "onboarding.json")
    business_details = None
    is_onboarded = False
    if os.path.exists(onboarding_file):
        try:
            with open(onboarding_file, "r", encoding="utf-8") as f:
                business_details = json.load(f)
                is_onboarded = True
        except Exception:
            pass
            
    # Read logo base64 if present
    logo_base64 = None
    for ext in ['.png', '.jpg', '.jpeg', '.svg']:
        logo_path = os.path.join(workspace_dir, f"logo{ext}")
        if os.path.exists(logo_path):
            try:
                with open(logo_path, "rb") as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                mime = "image/png"
                if ext == ".jpg" or ext == ".jpeg": mime = "image/jpeg"
                elif ext == ".svg": mime = "image/svg+xml"
                logo_base64 = f"data:{mime};base64,{encoded_string}"
                break
            except Exception:
                pass
            
    return {
        "email": email,
        "fullName": user_record.get("full_name"),
        "mobile": user_record.get("mobile"),
        "preferredLanguage": user_record.get("preferred_language"),
        "workspace_id": workspace_id,
        "workspace_dir": workspace_dir,
        "is_onboarded": is_onboarded,
        "business": business_details,
        "logo": logo_base64
    }

# Pydantic request structures
class SignupRequest(BaseModel):
    fullName: str
    email: str
    mobile: str
    password: str
    preferredLanguage: str

class LoginRequest(BaseModel):
    email: str
    password: str

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

class SupplierAddRequest(BaseModel):
    name: str
    phone: str
    email: str
    paymentTerms: str

class CustomerAddRequest(BaseModel):
    name: str
    email: str
    phone: str

class CampaignRequest(BaseModel):
    segment: str = None
    customer_id: str = None
    custom_offer: str = None
    provider: str = "gemini"

class POApproveRequest(BaseModel):
    productId: str
    supplierId: str
    quantity: int

class POReceiveRequest(BaseModel):
    poId: str

# Endpoints
@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to AegisAI SME Copilot Backend"}

# --- AUTHENTICATION & ONBOARDING ROUTES ---

@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    email_clean = req.email.strip().lower()
    users = load_users()
    if email_clean in users:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    pwd_hash, salt = hash_password(req.password)
    workspace_id = str(uuid.uuid4())
    
    users[email_clean] = {
        "full_name": req.fullName,
        "email": email_clean,
        "mobile": req.mobile,
        "password_hash": pwd_hash,
        "salt": salt,
        "preferred_language": req.preferredLanguage,
        "workspace_id": workspace_id,
        "created_at": datetime.now().isoformat()
    }
    save_users(users)
    
    # Initialize workspace folder
    workspace_dir = os.path.join(config.WORKSPACES_DIR, workspace_id)
    os.makedirs(workspace_dir, exist_ok=True)
    initialize_default_suppliers(workspace_dir)
    
    return {"success": True, "message": "User registered successfully"}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    email_clean = req.email.strip().lower()
    users = load_users()
    user_record = users.get(email_clean)
    if not user_record:
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    pwd_hash, _ = hash_password(req.password, user_record["salt"])
    if pwd_hash != user_record["password_hash"]:
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    # Generate session token
    token = str(uuid.uuid4())
    sessions = load_sessions()
    sessions[token] = email_clean
    save_sessions(sessions)
    
    # Check onboarding status
    workspace_id = user_record["workspace_id"]
    workspace_dir = os.path.join(config.WORKSPACES_DIR, workspace_id)
    onboarding_file = os.path.join(workspace_dir, "onboarding.json")
    is_onboarded = os.path.exists(onboarding_file)
    
    return {
        "success": True,
        "token": token,
        "user": {
            "fullName": user_record["full_name"],
            "email": email_clean,
            "mobile": user_record["mobile"],
            "preferredLanguage": user_record["preferred_language"],
            "isOnboarded": is_onboarded
        }
    }

@app.get("/api/auth/me")
def get_me(user_info: dict = Depends(get_current_user_workspace_info)):
    return {
        "authenticated": True,
        "user": {
            "fullName": user_info["fullName"],
            "email": user_info["email"],
            "mobile": user_info["mobile"],
            "preferredLanguage": user_info["preferredLanguage"],
            "isOnboarded": user_info["is_onboarded"]
        },
        "business": user_info["business"],
        "logo": user_info["logo"]
    }

@app.post("/api/auth/onboard")
async def onboard(
    businessName: str = Form(...),
    businessCategory: str = Form(...),
    businessLocation: str = Form(...),
    currency: str = Form("₹"),
    merchantWhatsapp: str = Form(...),
    enableInventory: str = Form("false"),
    enableWhatsapp: str = Form("false"),
    startFresh: str = Form("true"),
    businessLogo: UploadFile = File(None),
    productsFile: UploadFile = File(None),
    transactionsFile: UploadFile = File(None),
    authorization: str = Header(None)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    
    sessions = load_sessions()
    email = sessions.get(token)
    if not email:
        raise HTTPException(status_code=401, detail="Session expired")
        
    users = load_users()
    user_record = users.get(email)
    if not user_record:
        raise HTTPException(status_code=401, detail="User not found")
        
    workspace_id = user_record.get("workspace_id")
    workspace_dir = os.path.join(config.WORKSPACES_DIR, workspace_id)
    os.makedirs(workspace_dir, exist_ok=True)
    
    initialize_default_suppliers(workspace_dir)
    
    # Save optional logo
    if businessLogo and businessLogo.filename:
        logo_ext = os.path.splitext(businessLogo.filename)[1].lower()
        if logo_ext in ['.png', '.jpg', '.jpeg', '.svg']:
            logo_path = os.path.join(workspace_dir, f"logo{logo_ext}")
            for ext in ['.png', '.jpg', '.jpeg', '.svg']:
                prev_logo = os.path.join(workspace_dir, f"logo{ext}")
                if os.path.exists(prev_logo):
                    os.remove(prev_logo)
            with open(logo_path, "wb") as buffer:
                shutil.copyfileobj(businessLogo.file, buffer)
                
    # Save onboarding config
    onboarding_data = {
        "businessName": businessName,
        "businessCategory": businessCategory,
        "businessLocation": businessLocation,
        "currency": currency,
        "merchantWhatsapp": merchantWhatsapp,
        "enableInventory": enableInventory == "true",
        "enableWhatsapp": enableWhatsapp == "true",
        "startFresh": startFresh == "true"
    }
    
    with open(os.path.join(workspace_dir, "onboarding.json"), "w", encoding="utf-8") as f:
        json.dump(onboarding_data, f, indent=4)
        
    # Set up databases
    if startFresh == "true":
        initialize_empty_workspace(workspace_dir)
    else:
        inv_path = os.path.join(workspace_dir, "inventory.csv")
        if productsFile and productsFile.filename:
            try:
                prod_df = parse_uploaded_file(productsFile)
                map_and_save_products(prod_df, inv_path)
                
                # Sync unique suppliers from imported catalog
                for _, row in prod_df.iterrows():
                    p_id = str(row.get("ProductID", ""))
                    p_price = float(row.get("UnitPrice", 0.0))
                    p_sup = str(row.get("Supplier", "Unknown"))
                    if p_id and p_sup != "Unknown":
                        sync_product_with_supplier(workspace_dir, p_id, p_price, p_sup)
            except Exception as e:
                pd.DataFrame(columns=["ProductID", "ProductName", "Category", "StockLevel", "ReorderLevel", "UnitPrice", "RetailPrice", "Supplier"]).to_csv(inv_path, index=False)
                print(f"Products import failed: {e}")
        else:
            pd.DataFrame(columns=["ProductID", "ProductName", "Category", "StockLevel", "ReorderLevel", "UnitPrice", "RetailPrice", "Supplier"]).to_csv(inv_path, index=False)
            
        tx_path = os.path.join(workspace_dir, "transactions.csv")
        if transactionsFile and transactionsFile.filename:
            try:
                tx_df = parse_uploaded_file(transactionsFile)
                map_and_save_transactions(tx_df, tx_path)
            except Exception as e:
                pd.DataFrame(columns=["Date", "TransactionID", "ProductID", "ProductName", "Category", "Quantity", "Price", "Type", "Amount", "PaymentMode"]).to_csv(tx_path, index=False)
                print(f"Transactions import failed: {e}")
        else:
            pd.DataFrame(columns=["Date", "TransactionID", "ProductID", "ProductName", "Category", "Quantity", "Price", "Type", "Amount", "PaymentMode"]).to_csv(tx_path, index=False)

    return {"success": True, "message": "Onboarding completed successfully"}

# --- WORKSPACE PROTECTED COPILOT ROUTES ---

@app.get("/api/finance/summary")
def get_finance_summary(user_info: dict = Depends(get_current_user_workspace_info)):
    try:
        from forecasting.predictor import TRANSACTIONS_PATH
        tx_path = os.path.join(user_info["workspace_dir"], 'transactions.csv')
        
        if not os.path.exists(tx_path):
            return {
                "total_sales": 0.0,
                "total_expenses": 0.0,
                "net_profit": 0.0,
                "is_empty": True
            }
            
        tx_df = pd.read_csv(tx_path)
        if tx_df.empty:
            return {
                "total_sales": 0.0,
                "total_expenses": 0.0,
                "net_profit": 0.0,
                "is_empty": True
            }
            
        sales = float(tx_df[tx_df['Type'] == 'Sale']['Amount'].sum())
        expenses = float(tx_df[tx_df['Type'] == 'Expense']['Amount'].sum())
        profit = sales - expenses
        
        return {
            "total_sales": sales,
            "total_expenses": expenses,
            "net_profit": profit,
            "is_empty": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(req: ChatRequest, user_info: dict = Depends(get_current_user_workspace_info)):
    context = ""
    if req.use_rag:
        try:
            context = retrieve_context(req.query, k=3, workspace_dir=user_info["workspace_dir"])
        except Exception as e:
            print(f"RAG retrieval failed: {e}")
            context = "Unable to retrieve document context."
            
    try:
        result = coordinate_agents(req.query, context, provider=req.provider, workspace_dir=user_info["workspace_dir"])
        
        if "hello" in req.query.lower() or "hi" in req.query.lower() or "வணக்கம்" in req.query.lower():
            greeting = f"Welcome back, {user_info['fullName']}! It is great to assist you with {user_info['business']['businessName'] if user_info['business'] else 'your business'} today.\n\n"
            result["response"] = greeting + result["response"]
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent coordination error: {str(e)}")

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...), user_info: dict = Depends(get_current_user_workspace_info)):
    workspace_upload_dir = os.path.join(user_info["workspace_dir"], "uploads")
    os.makedirs(workspace_upload_dir, exist_ok=True)
    
    file_path = os.path.join(workspace_upload_dir, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        index_result = index_file(file_path, workspace_dir=user_info["workspace_dir"])
        return {"success": True, "message": index_result, "filename": file.filename}
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")

@app.get("/api/forecast")
def get_forecast(product_id: str = Query(None), days: int = Query(30), user_info: dict = Depends(get_current_user_workspace_info)):
    try:
        results = forecast_sales(product_id=product_id, days_ahead=days, workspace_dir=user_info["workspace_dir"])
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@app.get("/api/inventory/depletion")
def get_depletion(user_info: dict = Depends(get_current_user_workspace_info)):
    try:
        exhaustion_data = predict_inventory_exhaustion(workspace_dir=user_info["workspace_dir"])
        return exhaustion_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory depletion calculation error: {str(e)}")

@app.post("/api/inventory/add")
def add_inventory_product(req: ProductAddRequest, user_info: dict = Depends(get_current_user_workspace_info)):
    try:
        workspace_dir = user_info["workspace_dir"]
        inv_path = os.path.join(workspace_dir, "inventory.csv")
        
        if os.path.exists(inv_path):
            df = pd.read_csv(inv_path)
        else:
            df = pd.DataFrame(columns=["ProductID", "ProductName", "Category", "StockLevel", "ReorderLevel", "UnitPrice", "RetailPrice", "Supplier"])
            
        if req.ProductID in df["ProductID"].values:
            raise HTTPException(status_code=400, detail=f"Product with ID {req.ProductID} already exists.")
            
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
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        df.to_csv(inv_path, index=False)
        
        # Sync product with supplier.json catalog
        sync_product_with_supplier(workspace_dir, req.ProductID, req.UnitPrice, req.Supplier)
        
        return {"success": True, "message": f"Product {req.ProductName} successfully added to inventory."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add product: {str(e)}")

@app.post("/api/alerts/trigger-low-stock")
def trigger_low_stock_alerts(req: AlertRequest = None, user_info: dict = Depends(get_current_user_workspace_info)):
    try:
        depletion = predict_inventory_exhaustion(workspace_dir=user_info["workspace_dir"])
        low_stock_items = [item for item in depletion if item["Status"] == "Low Stock"]
        
        if not low_stock_items:
            return {"success": True, "alert_sent": False, "message": "All stock levels are currently healthy. No alerts triggered."}
            
        alerts_sent = []
        recipient = (req.custom_recipient if req else None) or (user_info["business"]["merchantWhatsapp"] if user_info["business"] else None)
        provider = req.provider if req else "gemini"
        
        for item in low_stock_items:
            alert_query = (
                f"Draft a short, urgent low stock WhatsApp alert notification for this product: "
                f"{item['ProductName']} (ID: {item['ProductID']}). "
                f"Current Stock: {item['CurrentStock']} units. Reorder limit: {item['ReorderLevel']}. "
                f"We are selling {item['DailyVelocity']} units per day, and will run out in {item['DaysRemaining']} days. "
                f"Supplier is {item['Supplier']}. Recommend restocking {item['ReorderRecommendation']} units."
            )
            
            context = f"Product details: {str(item)}"
            agent_result = coordinate_agents(alert_query, context, provider=provider, workspace_dir=user_info["workspace_dir"])
            alert_draft = agent_result["response"]
            
            send_result = send_whatsapp_message(alert_draft, to_number=recipient, workspace_dir=user_info["workspace_dir"])
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
def get_message_logs(user_info: dict = Depends(get_current_user_workspace_info)):
    return get_whatsapp_logs(workspace_dir=user_info["workspace_dir"])

@app.post("/api/whatsapp/clear")
def clear_message_logs(user_info: dict = Depends(get_current_user_workspace_info)):
    clear_whatsapp_logs(workspace_dir=user_info["workspace_dir"])
    return {"success": True, "message": "Logs cleared."}

# --- NEW SUPPLIER & PROCUREMENT DASHBOARD ROUTES ---

@app.get("/api/suppliers")
def get_suppliers(user_info: dict = Depends(get_current_user_workspace_info)):
    workspace_dir = user_info["workspace_dir"]
    suppliers_path = os.path.join(workspace_dir, "suppliers.json")
    
    if not os.path.exists(suppliers_path):
        initialize_default_suppliers(workspace_dir)
        
    try:
        with open(suppliers_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read suppliers: {str(e)}")

@app.post("/api/suppliers/add")
def add_supplier(req: SupplierAddRequest, user_info: dict = Depends(get_current_user_workspace_info)):
    workspace_dir = user_info["workspace_dir"]
    suppliers_path = os.path.join(workspace_dir, "suppliers.json")
    
    if not os.path.exists(suppliers_path):
        initialize_default_suppliers(workspace_dir)
        
    try:
        with open(suppliers_path, "r", encoding="utf-8") as f:
            suppliers = json.load(f)
            
        # Check duplicate
        for s in suppliers:
            if s["name"].lower() == req.name.lower():
                raise HTTPException(status_code=400, detail="Supplier name already exists.")
                
        sup_id = f"S{100 + len(suppliers) + 1}"
        new_sup = {
            "id": sup_id,
            "name": req.name,
            "phone": req.phone,
            "email": req.email,
            "reliability": 85,
            "payment_terms": req.paymentTerms,
            "catalog": []
        }
        suppliers.append(new_sup)
        
        with open(suppliers_path, "w", encoding="utf-8") as f:
            json.dump(suppliers, f, indent=4)
            
        return {"success": True, "message": f"Supplier {req.name} added successfully."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add supplier: {str(e)}")

@app.get("/api/procurement/recommendations")
def get_procurement_recommendations(user_info: dict = Depends(get_current_user_workspace_info)):
    workspace_dir = user_info["workspace_dir"]
    
    # 1. Fetch inventory stock alerts
    depletion = predict_inventory_exhaustion(workspace_dir)
    low_stock = [item for item in depletion if item["Status"] in ["Low Stock", "Approaching Outage"]]
    
    if not low_stock:
        return {"recommendations": []}
        
    # Load suppliers
    suppliers_path = os.path.join(workspace_dir, "suppliers.json")
    if not os.path.exists(suppliers_path):
        initialize_default_suppliers(workspace_dir)
    with open(suppliers_path, "r", encoding="utf-8") as f:
        suppliers = json.load(f)
        
    recommendations = []
    
    for item in low_stock:
        p_id = item["ProductID"]
        p_name = item["ProductName"]
        c_stock = item["CurrentStock"]
        r_level = item["ReorderLevel"]
        days_left = item["DaysRemaining"]
        velocity = item["DailyVelocity"]
        if velocity <= 0:
            velocity = 0.4
            
        # Reorder quantity to cover 30 days of sales
        qty_needed = max(5, int(math.ceil(velocity * 30 + r_level - c_stock)))
        
        # Check capable suppliers
        capable = []
        for s in suppliers:
            for catalog_item in s.get("catalog", []):
                if catalog_item["product_id"] == p_id:
                    capable.append({
                        "supplier_id": s["id"],
                        "supplier_name": s["name"],
                        "unit_price": catalog_item["unit_price"],
                        "min_order_qty": catalog_item["min_order_qty"],
                        "lead_time_days": catalog_item["lead_time_days"],
                        "reliability": s["reliability"]
                    })
                    break
                    
        if not capable:
            continue
            
        # Compute scores
        min_price = min(x["unit_price"] for x in capable)
        
        for c in capable:
            base_score = 100.0
            
            # Price Penalty
            price_penalty = 0.0
            if min_price > 0:
                price_diff_percent = (c["unit_price"] - min_price) / min_price
                price_penalty = 30.0 * price_diff_percent
                
            # Lead Time Penalty: Outage risk check
            lead_time_penalty = 0.0
            if c["lead_time_days"] > days_left:
                lead_time_penalty = 40.0 # High penalty for delivery delay past stockout
                
            c["procurement_score"] = round(max(0.0, (base_score - price_penalty - lead_time_penalty) * (c["reliability"] / 100.0)), 1)
            
        # Sort capable suppliers
        capable.sort(key=lambda x: x["procurement_score"], reverse=True)
        recommended = capable[0]
        
        # Determine quantity based on MOQ
        rec_qty = max(qty_needed, recommended["min_order_qty"])
        rec_price = recommended["unit_price"]
        expected_cost = rec_qty * rec_price
        reorder_span_days = round(rec_qty / velocity, 1)
        
        # Build comparison explanation text
        explanation_lines = []
        explanation_lines.append(f"Recommended Supplier: {recommended['supplier_name']} (Procurement Score: {recommended['procurement_score']}%).")
        explanation_lines.append(f"Order {rec_qty} units at Rs. {rec_price}/unit (Est. cost: Rs. {expected_cost:,.2f}), which will replenish your stock for approx {reorder_span_days} days.")
        
        if len(capable) > 1:
            alternatives = [x for x in capable if x["supplier_id"] != recommended["supplier_id"]]
            alt = alternatives[0]
            if alt["unit_price"] < recommended["unit_price"]:
                explanation_lines.append(f"Tradeoff: {alt['supplier_name']} offers a lower price (Rs. {alt['unit_price']} vs Rs. {recommended['unit_price']}), but their lead time is {alt['lead_time_days']} days. This is past your predicted {days_left} days depletion horizon, making them too slow to prevent a stockout.")
            else:
                explanation_lines.append(f"Comparison: Alternative supplier {alt['supplier_name']} scored lower ({alt['procurement_score']}%) due to higher unit pricing (Rs. {alt['unit_price']} vs Rs. {recommended['unit_price']}) or lower reliability ({alt['reliability']}%).")
                
        recommendations.append({
            "product_id": p_id,
            "product_name": p_name,
            "current_stock": c_stock,
            "reorder_level": r_level,
            "days_remaining": days_left,
            "recommended_supplier_id": recommended["supplier_id"],
            "recommended_supplier_name": recommended["supplier_name"],
            "recommended_quantity": rec_qty,
            "recommended_unit_price": rec_price,
            "expected_cost": expected_cost,
            "days_reorder_will_last": reorder_span_days,
            "capable_suppliers": capable,
            "reasoning": " ".join(explanation_lines)
        })
        
    return {"recommendations": recommendations}

@app.get("/api/procurement/orders")
def get_procurement_orders(user_info: dict = Depends(get_current_user_workspace_info)):
    workspace_dir = user_info["workspace_dir"]
    po_path = os.path.join(workspace_dir, "purchase_orders.json")
    
    if not os.path.exists(po_path):
        with open(po_path, "w", encoding="utf-8") as f:
            json.dump([], f)
            
    try:
        with open(po_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read POs: {str(e)}")

@app.post("/api/procurement/orders/approve")
def approve_recommendation(req: POApproveRequest, user_info: dict = Depends(get_current_user_workspace_info)):
    workspace_dir = user_info["workspace_dir"]
    po_path = os.path.join(workspace_dir, "purchase_orders.json")
    suppliers_path = os.path.join(workspace_dir, "suppliers.json")
    inv_path = os.path.join(workspace_dir, "inventory.csv")
    
    if not os.path.exists(po_path):
        with open(po_path, "w", encoding="utf-8") as f:
            json.dump([], f)
            
    try:
        # Load suppliers
        with open(suppliers_path, "r", encoding="utf-8") as f:
            suppliers = json.load(f)
        supplier = next((s for s in suppliers if s["id"] == req.supplierId), None)
        if not supplier:
            raise HTTPException(status_code=400, detail="Supplier not found.")
            
        # Get product pricing
        catalog_item = next((item for item in supplier.get("catalog", []) if item["product_id"] == req.productId), None)
        if not catalog_item:
            raise HTTPException(status_code=400, detail="Supplier does not supply this product.")
            
        # Read inventory for name
        df_inv = pd.read_csv(inv_path)
        prod_row = df_inv[df_inv["ProductID"] == req.productId]
        if prod_row.empty:
            raise HTTPException(status_code=400, detail="Product not found in inventory.")
        p_name = prod_row["ProductName"].values[0]
        p_cat = prod_row["Category"].values[0]
        
        # Load POs
        with open(po_path, "r", encoding="utf-8") as f:
            pos = json.load(f)
            
        # Calculate parameters
        expected_delivery = (datetime.now() + timedelta(days=catalog_item["lead_time_days"])).strftime("%Y-%m-%d")
        total_amount = req.quantity * catalog_item["unit_price"]
        po_id = f"PO_{1000 + len(pos) + 1}"
        
        new_po = {
            "po_id": po_id,
            "supplier_id": req.supplierId,
            "supplier_name": supplier["name"],
            "date_created": datetime.now().strftime("%Y-%m-%d"),
            "status": "Pending",
            "items": [
                {
                    "product_id": req.productId,
                    "product_name": p_name,
                    "quantity": req.quantity,
                    "unit_price": catalog_item["unit_price"]
                }
            ],
            "total_amount": total_amount,
            "expected_delivery": expected_delivery,
            "actual_delivery": None,
            "fulfillment_score": None
        }
        
        pos.append(new_po)
        with open(po_path, "w", encoding="utf-8") as f:
            json.dump(pos, f, indent=4)
            
        # Invoke Communication Agent to write ordering text
        alert_query = (
            f"Draft a professional WhatsApp purchase order message to {supplier['name']}. "
            f"We want to order {req.quantity} units of {p_name} at Rs. {catalog_item['unit_price']} each. "
            f"Total amount is Rs. {total_amount}. Delivery requested by {expected_delivery}. "
            f"Our business is {user_info['business']['businessName']}."
        )
        context = f"Supplier Contact Details: {str(supplier)}"
        agent_result = coordinate_agents(alert_query, context, provider="gemini", workspace_dir=workspace_dir)
        whatsapp_draft = agent_result["response"]
        
        # Also log inside WhatsApp simulator database
        log_whatsapp_message(
            to_number=supplier["phone"],
            body=f"Draft PO order text generated for {supplier['name']}: \n{whatsapp_draft}",
            status="Draft Prepared",
            workspace_dir=workspace_dir
        )
        
        return {
            "success": True,
            "message": f"Purchase Order {po_id} created successfully.",
            "po": new_po,
            "whatsapp_draft": whatsapp_draft
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve PO: {str(e)}")

@app.post("/api/procurement/orders/receive")
def receive_purchase_order(req: POReceiveRequest, user_info: dict = Depends(get_current_user_workspace_info)):
    workspace_dir = user_info["workspace_dir"]
    po_path = os.path.join(workspace_dir, "purchase_orders.json")
    suppliers_path = os.path.join(workspace_dir, "suppliers.json")
    inv_path = os.path.join(workspace_dir, "inventory.csv")
    tx_path = os.path.join(workspace_dir, "transactions.csv")
    
    try:
        # Load POs
        with open(po_path, "r", encoding="utf-8") as f:
            pos = json.load(f)
            
        po = next((p for p in pos if p["po_id"] == req.poId), None)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase Order not found.")
            
        if po["status"] == "Delivered":
            return {"success": True, "message": "Purchase Order already marked as delivered."}
            
        po["status"] = "Delivered"
        po["actual_delivery"] = datetime.now().strftime("%Y-%m-%d")
        
        # Calculate delivery speed fulfillment score
        date_created = datetime.strptime(po["date_created"], "%Y-%m-%d")
        expected_delivery = datetime.strptime(po["expected_delivery"], "%Y-%m-%d")
        actual_delivery = datetime.now()
        
        expected_days = (expected_delivery - date_created).days
        actual_days = (actual_delivery - date_created).days
        
        if actual_days <= expected_days:
            fulfillment_score = 100
        else:
            delay = actual_days - expected_days
            fulfillment_score = max(50, 100 - (delay * 10))
            
        po["fulfillment_score"] = fulfillment_score
        
        # Load suppliers and update rolling reliability average
        with open(suppliers_path, "r", encoding="utf-8") as f:
            suppliers = json.load(f)
            
        supplier = next((s for s in suppliers if s["id"] == po["supplier_id"]), None)
        if supplier:
            old_r = supplier["reliability"]
            # 70% previous score + 30% current fulfillment rolling fit
            new_r = int(round(old_r * 0.7 + fulfillment_score * 0.3))
            supplier["reliability"] = max(50, min(100, new_r))
            
        with open(suppliers_path, "w", encoding="utf-8") as f:
            json.dump(suppliers, f, indent=4)
            
        # Update Stock Level in inventory.csv
        df_inv = pd.read_csv(inv_path)
        for item in po["items"]:
            prod_id = item["product_id"]
            qty = item["quantity"]
            df_inv.loc[df_inv["ProductID"] == prod_id, "StockLevel"] += qty
        df_inv.to_csv(inv_path, index=False)
        
        # Log restocking as an Expense in transactions.csv
        if os.path.exists(tx_path):
            df_tx = pd.read_csv(tx_path)
        else:
            df_tx = pd.DataFrame(columns=["Date", "TransactionID", "ProductID", "ProductName", "Category", "Quantity", "Price", "Type", "Amount", "PaymentMode"])
            
        for item in po["items"]:
            prod_id = item["product_id"]
            p_name = item["product_name"]
            qty = item["quantity"]
            price = item["unit_price"]
            
            # Fetch Category from inventory
            prod_info = df_inv[df_inv["ProductID"] == prod_id]
            p_cat = prod_info["Category"].values[0] if not prod_info.empty else "Operations"
            
            new_row = {
                "Date": datetime.now().strftime("%Y-%m-%d"),
                "TransactionID": po["po_id"],
                "ProductID": prod_id,
                "ProductName": f"Restock - {p_name}",
                "Category": p_cat,
                "Quantity": qty,
                "Price": price,
                "Type": "Expense",
                "Amount": qty * price,
                "PaymentMode": "UPI"
            }
            df_tx = pd.concat([df_tx, pd.DataFrame([new_row])], ignore_index=True)
            
        df_tx.to_csv(tx_path, index=False)
        
        # Save POs
        with open(po_path, "w", encoding="utf-8") as f:
            json.dump(pos, f, indent=4)
            
        return {"success": True, "message": f"Purchase Order {po['po_id']} delivered. Inventory restocked and recorded."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to receive PO: {str(e)}")

# --- UNPROTECTED INTEGRATION INBOUND WEBHOOK ---

@app.post("/api/whatsapp/webhook")
async def twilio_webhook(From: str = Form(...), Body: str = Form(...)):
    clean_sender = From.replace("whatsapp:", "").strip()
    print(f"Incoming WhatsApp message from {clean_sender}: '{Body}'")
    
    # Resolve workspace by matching sender number to merchant mobile
    workspace_dir = None
    users = load_users()
    matched_workspace_id = None
    
    # 1. Match users by mobile
    for email, record in users.items():
        user_mob = record.get("mobile", "").replace(" ", "").replace("-", "")
        clean_mob = clean_sender.replace(" ", "").replace("-", "")
        if clean_mob in user_mob or user_mob in clean_mob:
            matched_workspace_id = record["workspace_id"]
            break
            
    # 2. Match workspaces by merchantWhatsapp in onboarding
    if not matched_workspace_id:
        for w_id in os.listdir(config.WORKSPACES_DIR):
            onb_file = os.path.join(config.WORKSPACES_DIR, w_id, "onboarding.json")
            if os.path.exists(onb_file):
                try:
                    with open(onb_file, "r", encoding="utf-8") as f:
                        onb_data = json.load(f)
                    merchant_mob = onb_data.get("merchantWhatsapp", "").replace(" ", "").replace("-", "")
                    clean_mob = clean_sender.replace(" ", "").replace("-", "")
                    if clean_mob in merchant_mob or merchant_mob in clean_mob:
                        matched_workspace_id = w_id
                        break
                except Exception:
                    pass
                    
    if matched_workspace_id:
        workspace_dir = os.path.join(config.WORKSPACES_DIR, matched_workspace_id)
        
    # 2. Retrieve context
    context = ""
    try:
        context = retrieve_context(Body, k=3, workspace_dir=workspace_dir)
    except Exception as e:
        print(f"Webhook RAG failed: {e}")
        
    # 3. Query Agent
    try:
        agent_result = coordinate_agents(Body, context, workspace_dir=workspace_dir)
        reply_body = agent_result["response"]
    except Exception as e:
        reply_body = f"Sorry, I encountered an error processing your query: {str(e)}"
        
    # Log messages inside active workspace
    log_whatsapp_message(From, f"Merchant asked: {Body}", "Received", workspace_dir)
    send_whatsapp_message(reply_body, to_number=From, workspace_dir=workspace_dir)
    
    # Return TwiML response to Twilio
    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Message>{reply_body}</Message>
    </Response>"""
    
    return Response(content=twiml_response, media_type="application/xml")

# --- NEW CUSTOMER INSIGHTS ROUTES ---

@app.get("/api/customers")
def get_customers(user_info: dict = Depends(get_current_user_workspace_info)):
    try:
        from forecasting.customer_analytics import get_customer_insights
        insights = get_customer_insights(user_info["workspace_dir"])
        return insights["customers"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch customers: {str(e)}")

@app.post("/api/customers/add")
def add_customer(req: CustomerAddRequest, user_info: dict = Depends(get_current_user_workspace_info)):
    workspace_dir = user_info["workspace_dir"]
    customers_path = os.path.join(workspace_dir, "customers.json")
    
    try:
        # Load existing
        if os.path.exists(customers_path):
            with open(customers_path, "r", encoding="utf-8") as f:
                customers = json.load(f)
        else:
            customers = []
            
        # Check if email/phone already exists
        for c in customers:
            if c["email"].lower() == req.email.strip().lower() or c["phone"] == req.phone.strip():
                raise HTTPException(status_code=400, detail="Customer with this email or phone already exists.")
                
        new_id = f"C{100 + len(customers) + 1}"
        new_cust = {
            "id": new_id,
            "name": req.name.strip(),
            "email": req.email.strip().lower(),
            "phone": req.phone.strip()
        }
        customers.append(new_cust)
        
        with open(customers_path, "w", encoding="utf-8") as f:
            json.dump(customers, f, indent=4)
            
        return {"success": True, "message": f"Customer {req.name} added successfully.", "customer": new_cust}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add customer: {str(e)}")

@app.get("/api/customer/insights")
def get_customer_insights_dashboard(inactive_days: int = 60, user_info: dict = Depends(get_current_user_workspace_info)):
    try:
        from forecasting.customer_analytics import get_customer_insights
        insights = get_customer_insights(user_info["workspace_dir"], config_inactive_days=inactive_days)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Customer analytics error: {str(e)}")

@app.post("/api/customer/campaign")
def generate_customer_campaign(req: CampaignRequest, user_info: dict = Depends(get_current_user_workspace_info)):
    workspace_dir = user_info["workspace_dir"]
    try:
        from forecasting.customer_analytics import get_customer_insights
        insights = get_customer_insights(workspace_dir)
        
        target_description = ""
        discount = req.custom_offer or "10% off checkout"
        
        # Check specific customer or segment targeting
        if req.customer_id:
            customer = next((c for c in insights["customers"] if c["id"] == req.customer_id), None)
            if not customer:
                raise HTTPException(status_code=404, detail="Customer not found")
            target_description = f"customer {customer['name']} (phone: {customer['phone']}) who is in the {customer['segment']} segment and prefers {', '.join(customer['pref_products'] or ['Grains'])}"
        elif req.segment:
            target_description = f"all customers in the '{req.segment}' segment"
        else:
            target_description = "our repeat customers"
            
        query = (
            f"Draft a personalized marketing WhatsApp message campaign targeting {target_description}. "
            f"Provide them a special discount of: {discount}. Keep it brief, friendly, with relevant emojis, "
            f"and make sure it mentions our business: {user_info['business']['businessName'] if user_info['business'] else 'AegisAI Partners'}."
        )
        
        context = f"Company business details: {str(user_info['business'])}"
        result = coordinate_agents(query, context, provider=req.provider, workspace_dir=workspace_dir)
        
        # Log campaign message in the Twilio simulation database
        target_phone = customer["phone"] if req.customer_id else "+919999999999"
        log_whatsapp_message(
            from_number="AegisAI Campaign",
            body=f"Draft campaign for {target_description}:\n\n{result['response']}",
            status="Campaign Drafted",
            workspace_dir=workspace_dir
        )
        
        return {
            "success": True,
            "campaign_draft": result["response"],
            "target": target_description,
            "offer": discount
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate campaign: {str(e)}")

# Run Uvicorn if file is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
