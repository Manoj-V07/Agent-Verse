import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def create_mock_data():
    os.makedirs('data', exist_ok=True)
    os.makedirs('uploads', exist_ok=True)
    
    # 1. Create Inventory Data
    inventory_items = [
        {"ProductID": "P101", "ProductName": "Premium Basmati Rice 5kg", "Category": "Grains", "StockLevel": 45, "ReorderLevel": 15, "UnitPrice": 350, "RetailPrice": 450, "Supplier": "Sri Balaji Traders"},
        {"ProductID": "P102", "ProductName": "Gold Winner Sunflower Oil 1L", "Category": "Oils", "StockLevel": 8, "ReorderLevel": 20, "UnitPrice": 110, "RetailPrice": 140, "Supplier": "Vignesh Wholesalers"},
        {"ProductID": "P103", "ProductName": "Tata Salt 1kg", "Category": "Condiments", "StockLevel": 60, "ReorderLevel": 25, "UnitPrice": 20, "RetailPrice": 28, "Supplier": "Tirupur Distributors"},
        {"ProductID": "P104", "ProductName": "Aashirvaad Shudh Chakki Atta 5kg", "Category": "Grains", "StockLevel": 12, "ReorderLevel": 15, "UnitPrice": 220, "RetailPrice": 280, "Supplier": "Sri Balaji Traders"},
        {"ProductID": "P105", "ProductName": "Toor Dal Premium 1kg", "Category": "Pulses", "StockLevel": 35, "ReorderLevel": 10, "UnitPrice": 140, "RetailPrice": 180, "Supplier": "Raja Pulses"},
        {"ProductID": "P106", "ProductName": "Britannia Marie Gold Biscuits", "Category": "Snacks", "StockLevel": 90, "ReorderLevel": 30, "UnitPrice": 12, "RetailPrice": 15, "Supplier": "Tirupur Distributors"},
        {"ProductID": "P107", "ProductName": "Brooke Bond Red Label Tea 250g", "Category": "Beverages", "StockLevel": 5, "ReorderLevel": 12, "UnitPrice": 95, "RetailPrice": 120, "Supplier": "Vignesh Wholesalers"},
        {"ProductID": "P108", "ProductName": "Sunsilk Black Shampoo 180ml", "Category": "Personal Care", "StockLevel": 22, "ReorderLevel": 8, "UnitPrice": 115, "RetailPrice": 145, "Supplier": "Vignesh Wholesalers"}
    ]
    df_inv = pd.DataFrame(inventory_items)
    df_inv.to_csv('data/inventory.csv', index=False)
    print("Created data/inventory.csv")
    
    # 2. Create Historical Transactions Data (Last 180 Days)
    np.random.seed(42)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    transactions = []
    txn_counter = 1000
    
    for single_date in date_range:
        # Number of sales on this day (weekday vs weekend seasonality)
        day_of_week = single_date.weekday()
        num_sales = np.random.randint(5, 15) if day_of_week < 5 else np.random.randint(10, 25)
        
        # Trend: slight upward growth over time
        days_passed = (single_date - start_date).days
        trend_factor = 1.0 + (days_passed / 360.0) # up to 50% growth at the end
        
        # Generate sales
        for _ in range(num_sales):
            txn_counter += 1
            item = np.random.choice(inventory_items)
            
            # Quantity sold (influenced by trend factor slightly)
            qty = int(np.random.choice([1, 2, 3, 5], p=[0.5, 0.3, 0.15, 0.05]) * (1.0 if np.random.rand() > 0.3 else 1.2))
            if qty < 1: qty = 1
            
            price = item["RetailPrice"]
            revenue = qty * price
            payment_mode = np.random.choice(["UPI", "Cash", "Card"], p=[0.6, 0.3, 0.1])
            
            transactions.append({
                "Date": single_date.strftime("%Y-%m-%d"),
                "TransactionID": f"TXN{txn_counter}",
                "ProductID": item["ProductID"],
                "ProductName": item["ProductName"],
                "Category": item["Category"],
                "Quantity": qty,
                "Price": price,
                "Type": "Sale",
                "Amount": revenue,
                "PaymentMode": payment_mode
            })
            
        # Daily Expenses (rent, bills, supplier payments, restock)
        # Periodic expenses: monthly rent/electricity
        if single_date.day == 1:
            # Rent
            transactions.append({
                "Date": single_date.strftime("%Y-%m-%d"),
                "TransactionID": f"TXN_RENT_{single_date.strftime('%m%Y')}",
                "ProductID": "EXP_RENT",
                "ProductName": "Shop Rent Payment",
                "Category": "Operations",
                "Quantity": 1,
                "Price": 12000,
                "Type": "Expense",
                "Amount": 12000,
                "PaymentMode": "UPI"
            })
        if single_date.day == 10:
            # Electricity Bill
            elec_bill = np.random.randint(2500, 4000)
            transactions.append({
                "Date": single_date.strftime("%Y-%m-%d"),
                "TransactionID": f"TXN_ELEC_{single_date.strftime('%m%Y')}",
                "ProductID": "EXP_ELEC",
                "ProductName": "Electricity Bill",
                "Category": "Utilities",
                "Quantity": 1,
                "Price": elec_bill,
                "Type": "Expense",
                "Amount": elec_bill,
                "PaymentMode": "UPI"
            })
            
        # Random supplier restocking expense
        if np.random.rand() < 0.15: # 15% chance daily
            item = np.random.choice(inventory_items)
            qty = np.random.randint(15, 50)
            cost = qty * item["UnitPrice"]
            transactions.append({
                "Date": single_date.strftime("%Y-%m-%d"),
                "TransactionID": f"TXN_RESTOCK_{txn_counter}",
                "ProductID": item["ProductID"],
                "ProductName": f"Restock: {item['ProductName']}",
                "Category": "Restock",
                "Quantity": qty,
                "Price": item["UnitPrice"],
                "Type": "Expense",
                "Amount": cost,
                "PaymentMode": "Cash"
            })
            
    df_txns = pd.DataFrame(transactions)
    df_txns.to_csv('data/transactions.csv', index=False)
    print(f"Created data/transactions.csv with {len(df_txns)} rows.")

if __name__ == '__main__':
    create_mock_data()
