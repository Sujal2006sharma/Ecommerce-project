from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.user import User
from backend.core.security import verify_password


# =====================================================
# AUTHENTICATE USER
# =====================================================

def authenticate_user(
    db: Session,
    username: str,
    password: str
) -> User:

    # -------------------------------------------------
    # FIND USER
    # -------------------------------------------------

    user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # -------------------------------------------------
    # CHECK ACTIVE
    # -------------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # -------------------------------------------------
    # VERIFY PASSWORD
    # -------------------------------------------------

    if not verify_password(
        password,
        user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # -------------------------------------------------
    # RETURN AUTHENTICATED USER
    # -------------------------------------------------

    return user