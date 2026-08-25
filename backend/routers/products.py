from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.schemas import ProductSchema

from backend.core.dependencies import require_roles

from backend.services.product_service import (
    create_product_service,
    get_products_service,
    get_product_service,
    update_product_service,
    update_product_status_service,
    delete_product_service,
    delete_all_products_service
)


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# =====================================================
# CREATE PRODUCT
#
# SUPERADMIN
# ADMIN
# SELLER
# =====================================================

@router.post("")
def create_product(
    product: ProductSchema,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN",
            "SELLER"
        )
    )
):

    return create_product_service(
        product,
        db
    )


# =====================================================
# GET ALL PRODUCTS
#
# ALL ROLES
# =====================================================

@router.get("")
def get_products(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN",
            "SELLER",
            "CUSTOMER"
        )
    )
):

    return get_products_service(
        db
    )


# =====================================================
# GET SINGLE PRODUCT
#
# ALL ROLES
# =====================================================

@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN",
            "SELLER",
            "CUSTOMER"
        )
    )
):

    return get_product_service(
        product_id,
        db
    )


# =====================================================
# UPDATE PRODUCT
#
# SUPERADMIN
# ADMIN
# SELLER
# =====================================================

@router.put("/{product_id}")
def update_product(
    product_id: int,
    product: ProductSchema,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN",
            "SELLER"
        )
    )
):

    return update_product_service(
        product_id,
        product,
        db
    )


# =====================================================
# UPDATE PRODUCT STATUS
#
# SUPERADMIN
# ADMIN
# SELLER
# =====================================================

@router.put("/{product_id}/status")
def update_product_status(
    product_id: int,
    status_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN",
            "SELLER"
        )
    )
):

    return update_product_status_service(
        product_id,
        status_id,
        db
    )


# =====================================================
# DELETE SINGLE PRODUCT
#
# SUPERADMIN
# ADMIN
# =====================================================

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )
):

    return delete_product_service(
        product_id,
        db
    )


# =====================================================
# DELETE ALL PRODUCTS
#
# SUPERADMIN ONLY
# =====================================================

@router.delete("")
def delete_all_products(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPERADMIN"
        )
    )
):

    return delete_all_products_service(
        db
    )