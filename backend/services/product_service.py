from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.models import Product, Category, Status


# =====================================================
# CREATE PRODUCT
# =====================================================

def create_product_service(
    product_data,
    db: Session
):

    # Check category
    category = db.query(Category).filter(
        Category.id == product_data.category_id
    ).first()

    if not category:

        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )


    # Check status
    status = None

    if product_data.status_id is not None:

        status = db.query(Status).filter(
            Status.id == product_data.status_id
        ).first()

        if not status:

            raise HTTPException(
                status_code=404,
                detail="Status Not Found"
            )


    # Create product
    new_product = Product(

        name=product_data.name,

        price=product_data.price,

        quantity=product_data.quantity,

        category_id=product_data.category_id,

        status_id=product_data.status_id
    )

    db.add(new_product)


    try:

        db.commit()

        db.refresh(new_product)


    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create product"
        )


    return {

        "message": "Product Created",

        "data": {

            "id": new_product.id,

            "name": new_product.name,

            "price": new_product.price,

            "quantity": new_product.quantity,

            "category_id": new_product.category_id,

            "category_name": category.name,

            "status_id": new_product.status_id,

            "status": (
                status.name
                if status
                else None
            )
        }
    }


# =====================================================
# GET ALL PRODUCTS
# =====================================================

def get_products_service(
    db: Session
):

    products = db.query(Product).all()

    data = []


    for product in products:

        images = []


        for image in product.images:

            images.append({

                "id": image.id,

                "filename": image.filename,

                "url": f"/images/{image.id}"
            })


        data.append({

            "id": product.id,

            "name": product.name,

            "price": product.price,

            "quantity": product.quantity,

            "category_id": product.category_id,

            "category_name": (

                product.category.name
                if product.category
                else None
            ),

            "status_id": product.status_id,

            "status": (

                product.status.name
                if product.status
                else None
            ),

            "images": images
        })


    return {

        "message": "Products Retrieved",

        "data": data
    }


# =====================================================
# GET SINGLE PRODUCT
# =====================================================

def get_product_service(
    product_id: int,
    db: Session
):

    product = db.query(Product).filter(

        Product.id == product_id

    ).first()


    if not product:

        raise HTTPException(

            status_code=404,

            detail="Product Not Found"
        )


    images = []


    for image in product.images:

        images.append({

            "id": image.id,

            "filename": image.filename,

            "url": f"/images/{image.id}"
        })


    return {

        "message": "Product Found",

        "data": {

            "id": product.id,

            "name": product.name,

            "price": product.price,

            "quantity": product.quantity,

            "category_id": product.category_id,

            "category_name": (

                product.category.name
                if product.category
                else None
            ),

            "status_id": product.status_id,

            "status": (

                product.status.name
                if product.status
                else None
            ),

            "images": images
        }
    }


# =====================================================
# UPDATE PRODUCT
# =====================================================

def update_product_service(
    product_id: int,
    product_data,
    db: Session
):

    # Find product
    existing_product = db.query(Product).filter(

        Product.id == product_id

    ).first()


    if not existing_product:

        raise HTTPException(

            status_code=404,

            detail="Product Not Found"
        )


    # Check category
    category = db.query(Category).filter(

        Category.id == product_data.category_id

    ).first()


    if not category:

        raise HTTPException(

            status_code=404,

            detail="Category Not Found"
        )


    # Check status
    status = None


    if product_data.status_id is not None:

        status = db.query(Status).filter(

            Status.id == product_data.status_id

        ).first()


        if not status:

            raise HTTPException(

                status_code=404,

                detail="Status Not Found"
            )


    # Update product
    existing_product.name = product_data.name

    existing_product.price = product_data.price

    existing_product.quantity = product_data.quantity

    existing_product.category_id = product_data.category_id

    existing_product.status_id = product_data.status_id


    try:

        db.commit()

        db.refresh(existing_product)


    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to update product"
        )


    return {

        "message": "Product Updated",

        "data": {

            "id": existing_product.id,

            "name": existing_product.name,

            "price": existing_product.price,

            "quantity": existing_product.quantity,

            "category_id": existing_product.category_id,

            "category_name": category.name,

            "status_id": existing_product.status_id,

            "status": (

                status.name
                if status
                else None
            )
        }
    }


# =====================================================
# UPDATE PRODUCT STATUS
# =====================================================

def update_product_status_service(
    product_id: int,
    status_id: int,
    db: Session
):

    # Find product
    product = db.query(Product).filter(

        Product.id == product_id

    ).first()


    if not product:

        raise HTTPException(

            status_code=404,

            detail="Product Not Found"
        )


    # Find status
    status = db.query(Status).filter(

        Status.id == status_id

    ).first()


    if not status:

        raise HTTPException(

            status_code=404,

            detail="Status Not Found"
        )


    # Update
    product.status_id = status_id


    try:

        db.commit()

        db.refresh(product)


    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to update product status"
        )


    return {

        "message": "Product Status Updated",

        "data": {

            "product_id": product.id,

            "status_id": status.id,

            "status": status.name
        }
    }


# =====================================================
# DELETE PRODUCT
# =====================================================

def delete_product_service(
    product_id: int,
    db: Session
):

    product = db.query(Product).filter(

        Product.id == product_id

    ).first()


    if not product:

        raise HTTPException(

            status_code=404,

            detail="Product Not Found"
        )


    db.delete(product)


    try:

        db.commit()


    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to delete product"
        )


    return {

        "message": "Product Deleted"
    }


# =====================================================
# DELETE ALL PRODUCTS
# =====================================================

def delete_all_products_service(
    db: Session
):

    try:

        db.query(Product).delete()

        db.commit()


        db.execute(

            text(
                "ALTER TABLE products AUTO_INCREMENT = 1"
            )
        )

        db.commit()


    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to delete products"
        )


    return {

        "message": "All Products Deleted"
    }