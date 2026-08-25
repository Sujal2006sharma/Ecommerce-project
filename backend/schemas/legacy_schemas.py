from pydantic import BaseModel


# =========================
# CATEGORY SCHEMAS
# =========================

class CategorySchema(BaseModel):
    name: str
    description: str | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    class Config:
        from_attributes = True


# =========================
# PRODUCT SCHEMAS
# =========================
class ProductSchema(BaseModel):

    name: str

    price: float

    quantity: int

    category_id: int

    status: str = "Order Accepted"

class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    quantity: int
    category_id: int
    category_name: str