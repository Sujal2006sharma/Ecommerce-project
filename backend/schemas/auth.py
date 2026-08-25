from pydantic import BaseModel


# =====================================================
# LOGIN REQUEST
# =====================================================

class LoginRequest(BaseModel):

    username: str

    password: str


# =====================================================
# TOKEN RESPONSE
# =====================================================

class TokenResponse(BaseModel):

    access_token: str

    token_type: str

    role: str


# =====================================================
# AUTHENTICATED USER RESPONSE
# =====================================================

class AuthUserResponse(BaseModel):

    id: int

    username: str

    email: str

    role: str

    is_active: bool

    permissions: list[str]