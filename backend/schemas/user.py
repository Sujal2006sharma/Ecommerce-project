from pydantic import BaseModel, EmailStr


# =====================================================
# USER CREATE
# =====================================================

class UserCreate(BaseModel):

    username: str

    email: EmailStr

    password: str

    role_id: int


# =====================================================
# USER RESPONSE
# =====================================================

class UserResponse(BaseModel):

    id: int

    username: str

    email: EmailStr

    role_id: int

    is_active: bool

    class Config:
        from_attributes = True