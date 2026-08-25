from pydantic import BaseModel


# =====================================================
# PRODUCT CREATE / UPDATE SCHEMA
# =====================================================

class ProductSchema(BaseModel):

    name: str

    price: float

    quantity: int

    category_id: int

    status_id: int | None = None


# =====================================================
# PRODUCT RESPONSE SCHEMA
# =====================================================

class ProductResponse(BaseModel):

    id: int

    name: str

    price: float

    quantity: int

    category_id: int

    status_id: int | None = None

    category_name: str | None = None