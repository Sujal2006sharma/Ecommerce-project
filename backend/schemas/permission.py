from pydantic import BaseModel


# =====================================================
# PERMISSION SCHEMA
# =====================================================

class PermissionSchema(BaseModel):

    name: str


# =====================================================
# PERMISSION RESPONSE
# =====================================================

class PermissionResponse(BaseModel):

    id: int

    name: str

    class Config:
        from_attributes = True