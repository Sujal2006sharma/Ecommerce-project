from pydantic import BaseModel


# =====================================================
# PRODUCT IMAGE RESPONSE SCHEMA
# =====================================================

class ProductImageResponse(BaseModel):

    id: int

    product_id: int

    filename: str

    content_type: str

    class Config:
        from_attributes = True