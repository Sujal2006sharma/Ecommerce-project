from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.models.user import User
from backend.core.security import decode_access_token


# =====================================================
# OAUTH2
# =====================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token"
)


# =====================================================
# GET CURRENT USER
# =====================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    # -------------------------------------------------
    # DECODE TOKEN
    # -------------------------------------------------

    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    # -------------------------------------------------
    # GET USER ID FROM TOKEN
    # -------------------------------------------------

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user ID missing",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    # -------------------------------------------------
    # CONVERT USER ID
    # -------------------------------------------------

    try:
        user_id = int(user_id)

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    # -------------------------------------------------
    # FIND USER
    # -------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    # -------------------------------------------------
    # CHECK USER ACTIVE
    # -------------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


# =====================================================
# SINGLE ROLE CHECK
# =====================================================

def require_role(
    required_role: str
) -> Callable:

    def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:

        # -------------------------------------------------
        # CHECK USER ROLE EXISTS
        # -------------------------------------------------

        if not current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no assigned role"
            )

        # -------------------------------------------------
        # GET ROLE FROM DATABASE
        # -------------------------------------------------

        current_role = current_user.role.name

        # -------------------------------------------------
        # CHECK ROLE
        # -------------------------------------------------

        if current_role.upper() != required_role.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied for this role"
            )

        return current_user

    return role_checker


# =====================================================
# MULTIPLE ROLE CHECK
# =====================================================

def require_roles(
    *allowed_roles: str
) -> Callable:

    # -------------------------------------------------
    # VALIDATE ROLES WERE PROVIDED
    # -------------------------------------------------

    if not allowed_roles:
        raise ValueError(
            "At least one allowed role must be provided"
        )

    def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:

        # -------------------------------------------------
        # CHECK USER ROLE EXISTS
        # -------------------------------------------------

        if not current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no assigned role"
            )

        # -------------------------------------------------
        # GET CURRENT ROLE FROM DATABASE
        # -------------------------------------------------

        current_role = current_user.role.name.upper()

        # -------------------------------------------------
        # NORMALIZE ALLOWED ROLES
        # -------------------------------------------------

        allowed_roles_upper = {
            role.upper()
            for role in allowed_roles
        }

        # -------------------------------------------------
        # CHECK ROLE
        # -------------------------------------------------

        if current_role not in allowed_roles_upper:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied. "
                    f"Allowed roles: "
                    f"{', '.join(allowed_roles)}"
                )
            )

        return current_user

    return role_checker