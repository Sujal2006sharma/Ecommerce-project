from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from backend.database.db import get_db

from backend.models.user import User
from backend.models.role import Role

from backend.schemas.user import (
    UserCreate,
    UserResponse
)

from backend.core.dependencies import require_roles

from backend.services.user_service import (
    create_user as create_user_service
)


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# =====================================================
# CREATE USER
# POST /users
#
# SUPERADMIN:
#   Can create ADMIN, SELLER, CUSTOMER
#
# ADMIN:
#   Can create CUSTOMER only
# =====================================================

@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(

    user_data: UserCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )
):

    # -------------------------------------------------
    # FIND SELECTED ROLE
    # -------------------------------------------------

    selected_role = (
        db.query(Role)
        .filter(Role.id == user_data.role_id)
        .first()
    )

    if not selected_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    selected_role_name = selected_role.name.upper()
    current_role_name = current_user.role.name.upper()

    # -------------------------------------------------
    # ADMIN CAN CREATE CUSTOMER ONLY
    # -------------------------------------------------

    if (
        current_role_name == "ADMIN"
        and selected_role_name != "CUSTOMER"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ADMIN can only create CUSTOMER users"
        )

    # -------------------------------------------------
    # SUPERADMIN CANNOT CREATE ANOTHER SUPERADMIN
    # -------------------------------------------------

    if selected_role_name == "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creating SUPERADMIN users is not allowed"
        )

    # -------------------------------------------------
    # CREATE USER
    # -------------------------------------------------

    new_user = create_user_service(
        db=db,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        role_id=user_data.role_id
    )

    return new_user


# =====================================================
# GET ALL USERS
# GET /users
#
# SUPERADMIN
# ADMIN
# =====================================================

@router.get(
    "",
    response_model=list[UserResponse]
)
def get_users(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )
):

    return db.query(User).all()


# =====================================================
# GET SINGLE USER
# GET /users/{user_id}
#
# SUPERADMIN
# ADMIN
# =====================================================

@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(

    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


# =====================================================
# ACTIVATE / DEACTIVATE USER
# PUT /users/{user_id}/active
#
# SUPERADMIN ONLY
# =====================================================

@router.put(
    "/{user_id}/active",
    response_model=UserResponse
)
def update_user_active_status(

    user_id: int,

    is_active: bool,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            "SUPERADMIN"
        )
    )
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # -------------------------------------------------
    # PREVENT SELF-DEACTIVATION
    # -------------------------------------------------

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own active status"
        )

    user.is_active = is_active

    try:

        db.commit()
        db.refresh(user)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user status"
        )

    return user


# =====================================================
# DELETE USER
# DELETE /users/{user_id}
#
# SUPERADMIN ONLY
# =====================================================

@router.delete(
    "/{user_id}"
)
def delete_user(

    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            "SUPERADMIN"
        )
    )
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # -------------------------------------------------
    # PREVENT SELF-DELETION
    # -------------------------------------------------

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete yourself"
        )

    # -------------------------------------------------
    # PREVENT DELETING SUPERADMIN
    # -------------------------------------------------

    if (
        user.role
        and user.role.name.upper() == "SUPERADMIN"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete a SUPERADMIN user"
        )

    try:

        db.delete(user)
        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )

    return {
        "message": "User deleted successfully"
    }