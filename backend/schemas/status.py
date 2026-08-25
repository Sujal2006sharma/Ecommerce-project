from pydantic import BaseModel


# =====================================================
# STATUS CREATE / UPDATE SCHEMA
# =====================================================

class StatusSchema(BaseModel):

    name: str


# =====================================================
# STATUS RESPONSE SCHEMA
# =====================================================

class StatusResponse(BaseModel):

    id: int

    name: str

    class Config:
        from_attributes = True