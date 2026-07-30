import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
import config

TRANSACTIONS_PATH = os.path.join(config.DATA_DIR, 'transactions.csv')
INVENTORY_PATH = os.path.join(config.DATA_DIR, 'inventory.csv')

def load_data(workspace_dir: str = None):
    """Loads transaction and inventory dataframes."""
    tx_df = pd.DataFrame()
    inv_df = pd.DataFrame()
    
    tx_path = os.path.join(workspace_dir, 'transactions.csv') if workspace_dir else TRANSACTIONS_PATH
    inv_path = os.path.join(workspace_dir, 'inventory.csv') if workspace_dir else INVENTORY_PATH
    
    if os.path.exists(tx_path):
        tx_df = pd.read_csv(tx_path)
        if not tx_df.empty and 'Date' in tx_df.columns:
            tx_df['Date'] = pd.to_datetime(tx_df['Date'])
    
    if os.path.exists(inv_path):
        inv_df = pd.read_csv(inv_path)
        
    return tx_df, inv_df

def forecast_sales(product_id: str = None, days_ahead: int = 30, workspace_dir: str = None) -> dict:
    """
    Predicts sales for the next N days.
    If product_id is specified, forecasts only for that product.
    Returns:
        dict: {
            "historical": {"dates": [...], "sales": [...]},
            "forecast": {"dates": [...], "sales": [...]},
            "growth_rate": float, # Percentage growth compared to previous period
            "total_forecasted_sales": float,
            "product_name": str or None
        }
    """
    tx_df, inv_df = load_data(workspace_dir)
    
    # Fallback to mock forecast if transactions file is empty/nonexistent
    if tx_df.empty:
        if workspace_dir:
            return {
                "historical": {"dates": [], "sales": []},
                "forecast": {"dates": [], "sales": []},
                "growth_rate": 0.0,
                "total_forecasted_sales": 0.0,
                "product_name": None,
                "is_empty": True
            }
        return get_mock_forecast(product_id, days_ahead)
        
    # Filter by product if requested
    prod_name = None
    if product_id:
        tx_df = tx_df[tx_df['ProductID'] == product_id]
        if not inv_df.empty and product_id in inv_df['ProductID'].values:
            prod_name = inv_df[inv_df['ProductID'] == product_id]['ProductName'].values[0]
            
    # Filter sales transactions (exclude expenses)
    sales_df = tx_df[tx_df['Type'] == 'Sale']
    if sales_df.empty:
        if workspace_dir:
            return {
                "historical": {"dates": [], "sales": []},
                "forecast": {"dates": [], "sales": []},
                "growth_rate": 0.0,
                "total_forecasted_sales": 0.0,
                "product_name": None,
                "is_empty": True
            }
        return get_mock_forecast(product_id, days_ahead)
        
    # Aggregate sales by date
    daily_sales = sales_df.groupby('Date')['Amount'].sum().reset_index()
    daily_sales = daily_sales.sort_values('Date')
    
    # Fill missing dates to make time series continuous
    daily_sales.set_index('Date', inplace=True)
    all_dates = pd.date_range(start=daily_sales.index.min(), end=daily_sales.index.max(), freq='D')
    daily_sales = daily_sales.reindex(all_dates, fill_value=0.0).reset_index()
    daily_sales.rename(columns={'index': 'Date'}, inplace=True)
    
    # Features for Scikit-Learn LinearRegression
    # We will use trend (day index) and seasonality (day of week)
    daily_sales['DayIndex'] = np.arange(len(daily_sales))
    daily_sales['DayOfWeek'] = daily_sales['Date'].dt.dayofweek
    
    # One-hot encode day of week
    X = pd.get_dummies(daily_sales, columns=['DayOfWeek'])
    feature_cols = ['DayIndex'] + [c for c in X.columns if c.startswith('DayOfWeek_')]
    
    # Ensure all 7 days of week features are present
    for i in range(7):
        col_name = f'DayOfWeek_{i}'
        if col_name not in X.columns:
            X[col_name] = 0
            
    X_features = X[feature_cols]
    y = X['Amount']
    
    # Fit model
    model = LinearRegression()
    model.fit(X_features, y)
    
    # Generate future dates and features
    last_date = daily_sales['Date'].max()
    future_dates = [last_date + timedelta(days=i) for i in range(1, days_ahead + 1)]
    future_indices = np.arange(len(daily_sales), len(daily_sales) + days_ahead)
    
    future_df = pd.DataFrame({'Date': future_dates, 'DayIndex': future_indices})
    future_df['DayOfWeek'] = future_df['Date'].dt.dayofweek
    future_df = pd.get_dummies(future_df, columns=['DayOfWeek'])
    
    for i in range(7):
        col_name = f'DayOfWeek_{i}'
        if col_name not in future_df.columns:
            future_df[col_name] = 0
            
    future_X = future_df[feature_cols]
    
    # Predict future sales
    predictions = model.predict(future_X)
    # Floor predictions at 0 (sales cannot be negative)
    predictions = np.clip(predictions, 0, None)
    
    # Calculate Growth Rate
    # Compare last 30 days with previous 30 days
    last_30_sum = daily_sales['Amount'].iloc[-30:].sum() if len(daily_sales) >= 30 else daily_sales['Amount'].sum()
    prev_30_sum = daily_sales['Amount'].iloc[-60:-30].sum() if len(daily_sales) >= 60 else 0
    
    if prev_30_sum > 0:
        growth_rate = ((last_30_sum - prev_30_sum) / prev_30_sum) * 100.0
    else:
        growth_rate = 5.4 # Default positive baseline if short history
        
    return {
        "historical": {
            "dates": daily_sales['Date'].dt.strftime('%Y-%m-%d').tolist(),
            "sales": daily_sales['Amount'].round(2).tolist()
        },
        "forecast": {
            "dates": [d.strftime('%Y-%m-%d') for d in future_dates],
            "sales": np.round(predictions, 2).tolist()
        },
        "growth_rate": round(growth_rate, 2),
        "total_forecasted_sales": round(float(np.sum(predictions)), 2),
        "product_name": prod_name
    }

def predict_inventory_exhaustion(workspace_dir: str = None) -> list[dict]:
    """
    Computes stock velocity (mean daily quantity sold) for each product.
    Estimates the days remaining before current stock is exhausted.
    Returns:
        list of dicts containing stock exhaustion details and restock recommendations.
    """
    tx_df, inv_df = load_data(workspace_dir)
    
    # If no inventory catalog exists, return empty or mock
    if inv_df.empty:
        if workspace_dir:
            return []
        return get_mock_exhaustion_data()
        
    # If in guest mode and transactions are empty, return mock data
    if not workspace_dir and tx_df.empty:
        return get_mock_exhaustion_data()
        
    # Get sales transactions
    if not tx_df.empty:
        sales_df = tx_df[(tx_df['Type'] == 'Sale') & (tx_df['ProductID'].isin(inv_df['ProductID']))]
    else:
        sales_df = pd.DataFrame()
    
    if not sales_df.empty:
        # Calculate average daily sales velocity (quantity sold per day) over the last 30 days
        cutoff_date = sales_df['Date'].max() - timedelta(days=30)
        recent_sales = sales_df[sales_df['Date'] >= cutoff_date]
        
        # Group by ProductID and calculate daily sales rate
        qty_sold = recent_sales.groupby('ProductID')['Quantity'].sum().reset_index()
        qty_sold['DailyVelocity'] = qty_sold['Quantity'] / 30.0
    else:
        qty_sold = pd.DataFrame(columns=['ProductID', 'DailyVelocity'])
    
    # Merge with inventory
    exhaustion_list = []
    
    for _, item in inv_df.iterrows():
        pid = item['ProductID']
        stock_raw = item['StockLevel']
        reorder_lvl_raw = item['ReorderLevel']
        
        # Get velocity
        vel_row = qty_sold[qty_sold['ProductID'] == pid]
        velocity_raw = float(vel_row['DailyVelocity'].values[0]) if not vel_row.empty else 0.4
        
        # Safe float casting and sanitization to prevent NaN/Infinity crashes
        try:
            stock = float(stock_raw)
            if np.isnan(stock) or np.isinf(stock):
                stock = 0.0
        except Exception:
            stock = 0.0
            
        try:
            reorder_lvl = float(reorder_lvl_raw)
            if np.isnan(reorder_lvl) or np.isinf(reorder_lvl):
                reorder_lvl = 10.0
        except Exception:
            reorder_lvl = 10.0
            
        try:
            velocity = float(velocity_raw)
            if np.isnan(velocity) or np.isinf(velocity) or velocity <= 0:
                velocity = 0.4
        except Exception:
            velocity = 0.4
            
        days_remaining = stock / velocity
        if np.isnan(days_remaining) or np.isinf(days_remaining):
            days_remaining = 999.0
            
        # Create recommendation
        status = "Safe"
        reorder_recommendation = 0
        
        if stock <= reorder_lvl:
            status = "Low Stock"
            # Recommendation: restock to cover 45 days of sales velocity, rounded to nearest 5
            reorder_recommendation = int(np.ceil(velocity * 45 / 5) * 5)
        elif days_remaining <= 10:
            status = "Approaching Outage"
            reorder_recommendation = int(np.ceil(velocity * 30 / 5) * 5)
            
        exhaustion_list.append({
            "ProductID": pid,
            "ProductName": item['ProductName'] if pd.notna(item['ProductName']) else "Unknown Product",
            "Category": item['Category'] if pd.notna(item['Category']) else "Grains",
            "CurrentStock": int(stock),
            "ReorderLevel": int(reorder_lvl),
            "DailyVelocity": round(velocity, 2),
            "DaysRemaining": round(days_remaining, 1),
            "Status": status,
            "ReorderRecommendation": reorder_recommendation,
            "Supplier": item['Supplier'] if pd.notna(item['Supplier']) else "Direct Purchase"
        })
        
    # Sort so urgent warnings are at the top
    exhaustion_list.sort(key=lambda x: (x['Status'] != 'Low Stock', x['DaysRemaining']))
    return exhaustion_list

def get_mock_forecast(product_id: str = None, days_ahead: int = 30) -> dict:
    """Generate logical fake historical data and predictions for demo mode."""
    today = datetime.now()
    dates = [today - timedelta(days=i) for i in range(60, 0, -1)]
    
    # Base sales trend: base Rs 8000/day + weekly wave + upward trend
    base_sales = 8000 if not product_id else 800
    hist_sales = []
    for i, d in enumerate(dates):
        wave = np.sin(2 * np.pi * d.weekday() / 7) * (base_sales * 0.3)
        trend = i * (base_sales * 0.005)
        noise = np.random.normal(0, base_sales * 0.1)
        amt = max(100.0, base_sales + wave + trend + noise)
        hist_sales.append(round(amt, 2))
        
    # Future forecasts
    fut_dates = [today + timedelta(days=i) for i in range(1, days_ahead + 1)]
    fut_sales = []
    start_index = len(dates)
    for i, d in enumerate(fut_dates):
        wave = np.sin(2 * np.pi * d.weekday() / 7) * (base_sales * 0.3)
        trend = (start_index + i) * (base_sales * 0.005)
        # Smooth forecast (no noise)
        amt = max(100.0, base_sales + wave + trend)
        fut_sales.append(round(amt, 2))
        
    return {
        "historical": {
            "dates": [d.strftime('%Y-%m-%d') for d in dates],
            "sales": hist_sales
        },
        "forecast": {
            "dates": [d.strftime('%Y-%m-%d') for d in fut_dates],
            "sales": fut_sales
        },
        "growth_rate": 8.52,
        "total_forecasted_sales": round(float(np.sum(fut_sales)), 2),
        "product_name": f"Mock Product ({product_id})" if product_id else "Total Business"
    }

def get_mock_exhaustion_data() -> list[dict]:
    """Fallback mock exhaustion analysis."""
    return [
        {"ProductID": "P102", "ProductName": "Gold Winner Sunflower Oil 1L", "Category": "Oils", "CurrentStock": 8, "ReorderLevel": 20, "DailyVelocity": 1.25, "DaysRemaining": 6.4, "Status": "Low Stock", "ReorderRecommendation": 60, "Supplier": "Vignesh Wholesalers"},
        {"ProductID": "P107", "ProductName": "Brooke Bond Red Label Tea 250g", "Category": "Beverages", "CurrentStock": 5, "ReorderLevel": 12, "DailyVelocity": 0.64, "DaysRemaining": 7.8, "Status": "Low Stock", "ReorderRecommendation": 30, "Supplier": "Vignesh Wholesalers"},
        {"ProductID": "P104", "ProductName": "Aashirvaad Shudh Chakki Atta 5kg", "Category": "Grains", "CurrentStock": 12, "ReorderLevel": 15, "DailyVelocity": 1.10, "DaysRemaining": 10.9, "Status": "Low Stock", "ReorderRecommendation": 50, "Supplier": "Sri Balaji Traders"},
        {"ProductID": "P101", "ProductName": "Premium Basmati Rice 5kg", "Category": "Grains", "CurrentStock": 45, "ReorderLevel": 15, "DailyVelocity": 1.80, "DaysRemaining": 25.0, "Status": "Safe", "ReorderRecommendation": 0, "Supplier": "Sri Balaji Traders"},
        {"ProductID": "P105", "ProductName": "Toor Dal Premium 1kg", "Category": "Pulses", "CurrentStock": 35, "ReorderLevel": 10, "DailyVelocity": 0.95, "DaysRemaining": 36.8, "Status": "Safe", "ReorderRecommendation": 0, "Supplier": "Raja Pulses"}
    ]
