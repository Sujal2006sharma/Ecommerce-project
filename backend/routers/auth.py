from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    OAuth2PasswordRequestForm
)

from sqlalchemy.orm import Session

from backend.database.db import get_db

from backend.schemas.auth import (
    LoginRequest,
    TokenResponse,
    AuthUserResponse
)

from backend.services.auth_service import (
    authenticate_user
)

from backend.core.security import (
    create_access_token
)

from backend.core.dependencies import (
    get_current_user,
    require_role
)

from backend.models.user import User


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =====================================================
# HELPER
# GET USER ROLE
# =====================================================

def get_user_role(user: User) -> str:

    if not user.role:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no assigned role"
        )

    return user.role.name.upper()


# =====================================================
# HELPER
# GET USER PERMISSIONS
# =====================================================

def get_user_permissions(
    user: User
) -> list[str]:

    # -------------------------------------------------
    # CHECK ROLE
    # -------------------------------------------------

    if not user.role:

        return []


    # -------------------------------------------------
    # GET PERMISSION NAMES
    # -------------------------------------------------

    return [
        permission.name
        for permission in user.role.permissions
    ]


# =====================================================
# JSON LOGIN
# POST /auth/login
# =====================================================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login(

    login_data: LoginRequest,

    db: Session = Depends(get_db)
):

    user = authenticate_user(
        db=db,
        username=login_data.username,
        password=login_data.password
    )

    role_name = get_user_role(user)

    access_token = create_access_token(
        user_id=user.id,
        role=role_name
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_name
    }


# =====================================================
# OAUTH2 TOKEN
# POST /auth/token
#
# Used by Swagger Authorize button
# =====================================================

@router.post(
    "/token",
    response_model=TokenResponse
)
def token(

    form_data: OAuth2PasswordRequestForm = Depends(),

    db: Session = Depends(get_db)
):

    user = authenticate_user(
        db=db,
        username=form_data.username,
        password=form_data.password
    )

    role_name = get_user_role(user)

    access_token = create_access_token(
        user_id=user.id,
        role=role_name
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_name
    }


# =====================================================
# CURRENT USER
# GET /auth/me
# =====================================================

@router.get(
    "/me",
    response_model=AuthUserResponse
)
def get_me(

    current_user: User = Depends(
        get_current_user
    )
):

    role_name = get_user_role(
        current_user
    )

    permissions = get_user_permissions(
        current_user
    )

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": role_name,
        "is_active": current_user.is_active,
        "permissions": permissions
    }


# =====================================================
# SUPERADMIN ONLY
# =====================================================

@router.get("/superadmin-only")
def superadmin_only(

    current_user: User = Depends(
        require_role("SUPERADMIN")
    )
):

    return {
        "message": "Welcome SUPERADMIN",
        "username": current_user.username,
        "role": current_user.role.name.upper()
    }


# =====================================================
# ADMIN ONLY
# =====================================================

@router.get("/admin-only")
def admin_only(

    current_user: User = Depends(
        require_role("ADMIN")
    )
):

    return {
        "message": "Welcome ADMIN",
        "username": current_user.username,
        "role": current_user.role.name.upper()
    }


# =====================================================
# SELLER ONLY
# =====================================================

@router.get("/seller-only")
def seller_only(

    current_user: User = Depends(
        require_role("SELLER")
    )
):

    return {
        "message": "Welcome SELLER",
        "username": current_user.username,
        "role": current_user.role.name.upper()
    }


# =====================================================
# CUSTOMER ONLY
# =====================================================

@router.get("/customer-only")
def customer_only(

    current_user: User = Depends(
        require_role("CUSTOMER")
    )
):

    return {
        "message": "Welcome CUSTOMER",
        "username": current_user.username,
        "role": current_user.role.name.upper()
    }