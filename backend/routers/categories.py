from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.database.db import get_db

from backend.models import Product, Category

from backend.schemas import (
    CategorySchema,
    CategoryResponse
)

from backend.core.dependencies import require_roles


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


# =====================================================
# CREATE CATEGORY
# POST /categories
#
# ALLOWED:
# SUPERADMIN
# ADMIN
# =====================================================

@router.post(
    "",
    response_model=CategoryResponse
)
def create_category(

    category: CategorySchema,

    db: Session = Depends(get_db),

    current_user = Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )

):

    existing_category = db.query(Category).filter(
        Category.name == category.name
    ).first()

    if existing_category:

        raise HTTPException(
            status_code=409,
            detail="Category already exists"
        )

    new_category = Category(
        name=category.name,
        description=category.description
    )

    db.add(new_category)

    try:

        db.commit()

        db.refresh(new_category)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create category"
        )

    return new_category


# =====================================================
# GET ALL CATEGORIES
# GET /categories
#
# PUBLIC ACCESS (GUESTS & ALL ROLES)
# =====================================================

@router.get(
    "",
    response_model=list[CategoryResponse]
)
def get_categories(
    db: Session = Depends(get_db)
):
    return db.query(Category).all()


# =====================================================
# GET SINGLE CATEGORY
# GET /categories/{category_id}
#
# PUBLIC ACCESS (GUESTS & ALL ROLES)
# =====================================================

@router.get(
    "/{category_id}",
    response_model=CategoryResponse
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category


# =====================================================
# UPDATE CATEGORY
# PUT /categories/{category_id}
#
# ALLOWED:
# SUPERADMIN
# ADMIN
# =====================================================

@router.put(
    "/{category_id}",
    response_model=CategoryResponse
)
def update_category(

    category_id: int,

    category: CategorySchema,

    db: Session = Depends(get_db),

    current_user = Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )

):

    existing_category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not existing_category:

        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )

    duplicate_category = db.query(Category).filter(
        Category.name == category.name,
        Category.id != category_id
    ).first()

    if duplicate_category:

        raise HTTPException(
            status_code=409,
            detail="Category name already exists"
        )

    existing_category.name = category.name

    existing_category.description = category.description

    try:

        db.commit()

        db.refresh(existing_category)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update category"
        )

    return existing_category


# =====================================================
# DELETE SINGLE CATEGORY
# DELETE /categories/{category_id}
#
# ALLOWED:
# SUPERADMIN
# ADMIN
# =====================================================

@router.delete(
    "/{category_id}"
)
def delete_category(

    category_id: int,

    db: Session = Depends(get_db),

    current_user = Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )

):

    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:

        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )

    product_count = db.query(Product).filter(
        Product.category_id == category_id
    ).count()

    if product_count > 0:

        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete category "
                "because products are using it"
            )
        )

    db.delete(category)

    try:

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete category"
        )

    return {
        "message": "Category Deleted"
    }


# =====================================================
# DELETE ALL CATEGORIES
# DELETE /categories
#
# ALLOWED:
# SUPERADMIN ONLY
# =====================================================

@router.delete("")
def delete_all_categories(

    db: Session = Depends(get_db),

    current_user = Depends(
        require_roles(
            "SUPERADMIN"
        )
    )

):

    product_count = db.query(Product).count()

    if product_count > 0:

        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete categories "
                "while products exist"
            )
        )

    try:

        db.query(Category).delete()

        db.commit()

        db.execute(
            text(
                "ALTER TABLE categories "
                "AUTO_INCREMENT = 1"
            )
        )

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete categories"
        )

    return {
        "message": "All Categories Deleted"
    }