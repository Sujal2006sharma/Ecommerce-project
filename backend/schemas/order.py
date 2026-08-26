from pydantic import BaseModel
from typing import List
from datetime import datetime


# =====================================================
# ORDER ITEM CREATE
# =====================================================
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


# =====================================================
# ORDER CREATE (UPDATED WITH REAL CUSTOMER DATA)
# =====================================================
class OrderCreate(BaseModel):
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    shipping_address: str | None = None
    items: List[OrderItemCreate]


# =====================================================
# ORDER ITEM RESPONSE
# =====================================================
class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    quantity: int
    price: float

    class Config:
        from_attributes = True


# =====================================================
# ORDER RESPONSE (UPDATED WITH REAL CUSTOMER DATA)
# =====================================================
class OrderResponse(BaseModel):
    id: int
    user_id: int
    username: str | None = None
    email: str | None = None
    
    # Real customer checkout details
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    shipping_address: str | None = None

    total_amount: float
    status_id: int | None
    status: str | None = None
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# =====================================================
# ORDER STATUS UPDATE
# =====================================================
class OrderStatusUpdate(BaseModel):
    status_id: int