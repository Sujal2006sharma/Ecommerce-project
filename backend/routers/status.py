from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.models import Status

from backend.core.dependencies import require_roles


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/status",
    tags=["Status"]
)


# =====================================================
# GET ALL STATUSES
# GET /status
#
# ALLOWED:
# SUPERADMIN
# ADMIN
# SELLER
# CUSTOMER
# =====================================================

@router.get("")
def get_statuses(

    db: Session = Depends(get_db),

    current_user = Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN",
            "SELLER",
            "CUSTOMER"
        )
    )

):

    statuses = db.query(Status).all()

    return {
        "message": "Statuses Retrieved",
        "data": [
            {
                "id": status.id,
                "name": status.name
            }
            for status in statuses
        ]
    }