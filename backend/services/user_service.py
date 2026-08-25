from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.user import User
from backend.models.role import Role
from backend.core.security import hash_password


# =====================================================
# CREATE USER
# =====================================================

def create_user(
    db: Session,
    username: str,
    email: str,
    password: str,
    role_id: int
) -> User:

    # -------------------------------------------------
    # CHECK USERNAME
    # -------------------------------------------------

    existing_username = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # -------------------------------------------------
    # CHECK EMAIL
    # -------------------------------------------------

    existing_email = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    # -------------------------------------------------
    # CHECK ROLE
    # -------------------------------------------------

    role = (
        db.query(Role)
        .filter(Role.id == role_id)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    # -------------------------------------------------
    # HASH PASSWORD
    # -------------------------------------------------

    hashed_password = hash_password(password)

    # -------------------------------------------------
    # CREATE USER
    # -------------------------------------------------

    user = User(
        username=username,
        email=email,
        password=hashed_password,
        role_id=role.id,
        is_active=True
    )

    try:

        db.add(user)

        db.commit()

        db.refresh(user)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

    return user