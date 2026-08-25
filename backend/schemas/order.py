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
# ORDER CREATE
# =====================================================

class OrderCreate(BaseModel):

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
# ORDER RESPONSE
# =====================================================

class OrderResponse(BaseModel):

    id: int

    user_id: int

    username: str | None = None

    email: str | None = None

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