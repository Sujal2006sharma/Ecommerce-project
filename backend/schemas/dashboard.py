from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel


# =====================================================
# RECENT ORDER SCHEMA
# =====================================================

class RecentOrderSchema(BaseModel):
    id: int
    customer_name: str
    total_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# DAILY REVENUE SCHEMA
# =====================================================

class DailyRevenueSchema(BaseModel):
    date: str
    revenue: float


# =====================================================
# DASHBOARD STATISTICS SCHEMA
# =====================================================

class DashboardStatistics(BaseModel):

    # GENERAL METRICS
    total_users: int
    total_products: int
    total_categories: int
    total_stock: int
    total_orders: int
    total_revenue: float

    # ORDER STATUS BREAKDOWN
    pending_orders: int
    accepted_orders: int
    rejected_orders: int
    shipped_orders: int
    out_for_delivery_orders: int
    delivered_orders: int

    # NEW: TABLES & TRENDS
    recent_orders: List[RecentOrderSchema] = []
    daily_revenue: List[DailyRevenueSchema] = []

    class Config:
        from_attributes = True