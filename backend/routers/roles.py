from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from backend.database.db import get_db

from backend.models.role import Role

from backend.models.permission import Permission

from backend.schemas.role import (
    RoleResponse,
    RolePermissionsUpdate,
    RolePermissionResponse
)

from backend.core.dependencies import (
    require_roles
)


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)


# =====================================================
# GET ALL ROLES
#
# SUPERADMIN
# ADMIN
# =====================================================

@router.get(
    "",
    response_model=list[RoleResponse]
)
def get_roles(

    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )
):

    roles = db.query(
        Role
    ).order_by(
        Role.id
    ).all()

    return roles


# =====================================================
# GET SINGLE ROLE
#
# SUPERADMIN
# ADMIN
# =====================================================

@router.get(
    "/{role_id}",
    response_model=RoleResponse
)
def get_role(

    role_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )
):

    role = db.query(
        Role
    ).filter(
        Role.id == role_id
    ).first()


    if not role:

        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )


    return role


# =====================================================
# GET ROLE PERMISSIONS
#
# SUPERADMIN ONLY
# =====================================================

@router.get(
    "/{role_id}/permissions",
    response_model=list[RolePermissionResponse]
)
def get_role_permissions(

    role_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles(
            "SUPERADMIN"
        )
    )
):

    # -------------------------------------------------
    # FIND ROLE
    # -------------------------------------------------

    role = db.query(
        Role
    ).filter(
        Role.id == role_id
    ).first()


    if not role:

        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )


    # -------------------------------------------------
    # RETURN ROLE PERMISSIONS
    # -------------------------------------------------

    return role.permissions


# =====================================================
# UPDATE ROLE PERMISSIONS
#
# SUPERADMIN ONLY
# =====================================================

@router.put(
    "/{role_id}/permissions",
    response_model=list[RolePermissionResponse]
)
def update_role_permissions(

    role_id: int,

    permission_data: RolePermissionsUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_roles(
            "SUPERADMIN"
        )
    )
):

    # -------------------------------------------------
    # FIND ROLE
    # -------------------------------------------------

    role = db.query(
        Role
    ).filter(
        Role.id == role_id
    ).first()


    if not role:

        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )


    # -------------------------------------------------
    # FIND SELECTED PERMISSIONS
    # -------------------------------------------------

    permissions = db.query(
        Permission
    ).filter(
        Permission.id.in_(
            permission_data.permission_ids
        )
    ).all()


    # -------------------------------------------------
    # VALIDATE ALL PERMISSIONS EXIST
    # -------------------------------------------------

    if (
        len(permissions)
        != len(set(permission_data.permission_ids))
    ):

        raise HTTPException(
            status_code=404,
            detail="One or more permissions not found"
        )


    # -------------------------------------------------
    # REPLACE ROLE PERMISSIONS
    # -------------------------------------------------

    role.permissions = permissions


    # -------------------------------------------------
    # SAVE CHANGES
    # -------------------------------------------------

    try:

        db.commit()

        db.refresh(role)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update role permissions"
        )


    # -------------------------------------------------
    # RETURN UPDATED PERMISSIONS
    # -------------------------------------------------

    return role.permissions