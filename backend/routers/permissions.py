from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from backend.database.db import get_db

from backend.models.permission import Permission

from backend.schemas.permission import (
    PermissionResponse
)

from backend.core.dependencies import (
    require_roles
)


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"]
)


# =====================================================
# GET ALL PERMISSIONS
#
# SUPERADMIN ONLY
# =====================================================

@router.get(
    "",
    response_model=list[PermissionResponse]
)
def get_permissions(

    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles(
            "SUPERADMIN"
        )
    )
):

    permissions = db.query(
        Permission
    ).order_by(
        Permission.id
    ).all()

    return permissions


# =====================================================
# GET SINGLE PERMISSION
#
# SUPERADMIN ONLY
# =====================================================

@router.get(
    "/{permission_id}",
    response_model=PermissionResponse
)
def get_permission(

    permission_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles(
            "SUPERADMIN"
        )
    )
):

    permission = db.query(
        Permission
    ).filter(
        Permission.id == permission_id
    ).first()


    if not permission:

        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )


    return permission