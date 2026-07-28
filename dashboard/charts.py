import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np

# Premium color palette configurations
COLOR_SALES = "#4f46e5"       # Indigo
COLOR_EXPENSE = "#f43f5e"     # Rose/Coral
COLOR_SAFE = "#10b981"        # Emerald
COLOR_WARN = "#f59e0b"        # Amber
COLOR_CRITICAL = "#ef4444"    # Red
COLOR_GRID = "#e2e8f0"        # Light gray grid lines
COLOR_DARK_GRID = "#334155"   # Dark theme grid lines

def plot_sales_vs_expenses(tx_df: pd.DataFrame) -> go.Figure:
    """Plots daily/weekly Sales vs Expenses trend."""
    if tx_df.empty:
        # Return empty placeholder figure
        fig = go.Figure()
        fig.update_layout(title="No transaction data available")
        return fig
        
    # Standardize types and dates
    df = tx_df.copy()
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Aggregate by Date and Type
    daily = df.groupby([df['Date'].dt.to_period('W').dt.to_timestamp(), 'Type'])['Amount'].sum().reset_index()
    
    sales = daily[daily['Type'] == 'Sale']
    expenses = daily[daily['Type'] == 'Expense']
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=sales['Date'],
        y=sales['Amount'],
        name="Sales (Revenue)",
        marker_color=COLOR_SALES,
        opacity=0.85
    ))
    
    fig.add_trace(go.Bar(
        x=expenses['Date'],
        y=expenses['Amount'],
        name="Expenses (Outflows)",
        marker_color=COLOR_EXPENSE,
        opacity=0.85
    ))
    
    fig.update_layout(
        title={
            "text": "Weekly Financial Flow (Sales vs Expenses)",
            "font": {"size": 18, "family": "Inter, sans-serif"}
        },
        barmode='group',
        template='plotly_white',
        xaxis_title="Date",
        yaxis_title="Amount (Rs.)",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=40, r=40, t=80, b=40),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        hovermode="x unified"
    )
    
    fig.update_xaxes(showgrid=True, gridcolor=COLOR_GRID)
    fig.update_yaxes(showgrid=True, gridcolor=COLOR_GRID)
    return fig

def plot_category_distribution(tx_df: pd.DataFrame) -> go.Figure:
    """Plots category revenue share as a donut chart."""
    if tx_df.empty:
        fig = go.Figure()
        fig.update_layout(title="No category data available")
        return fig
        
    sales_df = tx_df[tx_df['Type'] == 'Sale']
    if sales_df.empty:
        fig = go.Figure()
        fig.update_layout(title="No sales data for category breakdown")
        return fig
        
    cat_revenue = sales_df.groupby('Category')['Amount'].sum().reset_index()
    
    fig = go.Figure(data=[go.Pie(
        labels=cat_revenue['Category'],
        values=cat_revenue['Amount'],
        hole=.45,
        marker=dict(colors=px.colors.qualitative.Prism),
        textinfo='percent+label',
        insidetextorientation='radial'
    )])
    
    fig.update_layout(
        title={
            "text": "Revenue Share by Product Category",
            "font": {"size": 18, "family": "Inter, sans-serif"}
        },
        template='plotly_white',
        margin=dict(l=20, r=20, t=50, b=20),
        paper_bgcolor='rgba(0,0,0,0)',
        showlegend=True
    )
    return fig

def plot_inventory_levels(inv_df: pd.DataFrame) -> go.Figure:
    """Plots current stock levels vs reorder threshold, color-coding low stock."""
    if inv_df.empty:
        fig = go.Figure()
        fig.update_layout(title="No inventory data available")
        return fig
        
    df = inv_df.copy()
    
    # Determine colors dynamically based on stock warning
    colors = []
    for _, r in df.iterrows():
        if r['StockLevel'] <= (r['ReorderLevel'] * 0.5):
            colors.append(COLOR_CRITICAL) # Under 50% reorder limit
        elif r['StockLevel'] <= r['ReorderLevel']:
            colors.append(COLOR_WARN)     # Under reorder limit
        else:
            colors.append(COLOR_SAFE)     # Safe
            
    fig = go.Figure()
    
    # Current stock bars
    fig.add_trace(go.Bar(
        x=df['ProductName'],
        y=df['StockLevel'],
        name="Current Stock",
        marker_color=colors,
        text=df['StockLevel'],
        textposition='outside',
        width=0.4
    ))
    
    # Reorder Threshold (represented as dots/lines)
    fig.add_trace(go.Scatter(
        x=df['ProductName'],
        y=df['ReorderLevel'],
        name="Reorder Threshold",
        mode='markers+lines',
        marker=dict(color=COLOR_EXPENSE, size=10, symbol='x'),
        line=dict(color=COLOR_EXPENSE, width=1, dash='dash')
    ))
    
    fig.update_layout(
        title={
            "text": "Product Inventory Levels vs. Reorder Limits",
            "font": {"size": 18, "family": "Inter, sans-serif"}
        },
        template='plotly_white',
        xaxis_title="Product Name",
        yaxis_title="Quantity (Units)",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=40, r=40, t=80, b=80),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    fig.update_xaxes(tickangle=45, showgrid=False)
    fig.update_yaxes(showgrid=True, gridcolor=COLOR_GRID)
    
    return fig

def plot_sales_forecast(forecast_data: dict) -> go.Figure:
    """Plots historical sales and connects it with predicted sales."""
    hist_dates = forecast_data["historical"]["dates"]
    hist_sales = forecast_data["historical"]["sales"]
    fore_dates = forecast_data["forecast"]["dates"]
    fore_sales = forecast_data["forecast"]["sales"]
    
    # Combine dates for a continuous look
    # Grab the last historical date/sale to join the lines smoothly
    join_date = hist_dates[-1]
    join_sale = hist_sales[-1]
    
    fig = go.Figure()
    
    # Historical Sales Trace
    fig.add_trace(go.Scatter(
        x=hist_dates,
        y=hist_sales,
        name="Historical Revenue",
        mode='lines',
        line=dict(color=COLOR_SALES, width=3),
        fill='tozeroy',
        fillcolor='rgba(79, 70, 229, 0.08)'
    ))
    
    # Forecasted Sales Trace (connected to join point)
    fig.add_trace(go.Scatter(
        x=[join_date] + fore_dates,
        y=[join_sale] + fore_sales,
        name="30-Day Predicted Sales",
        mode='lines+markers',
        line=dict(color=COLOR_SAFE, width=3, dash='dash'),
        marker=dict(color=COLOR_SAFE, size=4),
        fill='tozeroy',
        fillcolor='rgba(16, 185, 129, 0.05)'
    ))
    
    prod_label = forecast_data.get("product_name") or "Total Business"
    
    fig.update_layout(
        title={
            "text": f"Sales Forecast: {prod_label}",
            "font": {"size": 18, "family": "Inter, sans-serif"}
        },
        template='plotly_white',
        xaxis_title="Date",
        yaxis_title="Sales Revenue (Rs.)",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=40, r=40, t=80, b=40),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        hovermode="x unified"
    )
    
    fig.update_xaxes(showgrid=True, gridcolor=COLOR_GRID)
    fig.update_yaxes(showgrid=True, gridcolor=COLOR_GRID)
    
    return fig
