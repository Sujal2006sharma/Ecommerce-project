from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Response
)

from sqlalchemy.orm import Session

from backend.database.db import get_db

from backend.models import (
    Product,
    ProductImage
)

from backend.core.dependencies import (
    require_roles
)


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    tags=["Images"]
)


# =====================================================
# UPLOAD PRODUCT IMAGE
# POST /products/{product_id}/images
#
# ALLOWED:
# SUPERADMIN
# ADMIN
# SELLER
# =====================================================

@router.post(
    "/products/{product_id}/images"
)
async def upload_product_image(

    product_id: int,

    file: UploadFile = File(...),

    db: Session = Depends(get_db),

    current_user = Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN",
            "SELLER"
        )
    )
):

    # -------------------------------------------------
    # FIND PRODUCT
    # -------------------------------------------------

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:

        raise HTTPException(
            status_code=404,
            detail="Product Not Found"
        )

    # -------------------------------------------------
    # READ IMAGE
    # -------------------------------------------------

    image_data = await file.read()

    # -------------------------------------------------
    # CREATE IMAGE
    # -------------------------------------------------

    new_image = ProductImage(
        product_id=product_id,
        filename=file.filename,
        content_type=file.content_type,
        image_data=image_data
    )

    db.add(new_image)

    try:

        db.commit()

        db.refresh(new_image)

    except Exception as e:

        db.rollback()

        print(
            "IMAGE UPLOAD ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to upload image"
        )

    return {
        "message": "Image Uploaded Successfully",
        "data": {
            "id": new_image.id,
            "product_id": new_image.product_id,
            "filename": new_image.filename,
            "content_type": new_image.content_type
        }
    }


# =====================================================
# GET IMAGE
# GET /images/{image_id}
#
# ALLOWED:
# SUPERADMIN
# ADMIN
# SELLER
# CUSTOMER
# =====================================================

@router.get(
    "/images/{image_id}"
)
def get_image(

    image_id: int,

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

    image = db.query(ProductImage).filter(
        ProductImage.id == image_id
    ).first()

    if not image:

        raise HTTPException(
            status_code=404,
            detail="Image Not Found"
        )

    return Response(
        content=image.image_data,
        media_type=image.content_type
    )


# =====================================================
# DELETE IMAGE
# DELETE /images/{image_id}
#
# ALLOWED:
# SUPERADMIN
# ADMIN
# =====================================================

@router.delete(
    "/images/{image_id}"
)
def delete_image(

    image_id: int,

    db: Session = Depends(get_db),

    current_user = Depends(
        require_roles(
            "SUPERADMIN",
            "ADMIN"
        )
    )
):

    image = db.query(ProductImage).filter(
        ProductImage.id == image_id
    ).first()

    if not image:

        raise HTTPException(
            status_code=404,
            detail="Image Not Found"
        )

    db.delete(image)

    try:

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete image"
        )

    return {
        "message": "Image Deleted Successfully"
    }