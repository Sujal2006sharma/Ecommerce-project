from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import text

from fastapi.middleware.cors import CORSMiddleware

from db import Base, engine, get_db
from models import Product, Category, ProductImage,Status
from schemas import (
    ProductSchema,
    ProductResponse,
    CategorySchema,
    CategoryResponse
)

app = FastAPI()

# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# CREATE TABLES
# =========================================================


Base.metadata.create_all(bind=engine)


# =========================================================
# CATEGORY CRUD
# =========================================================


# ---------------------------------------------------------
# CREATE CATEGORY
# POST /categories
# ---------------------------------------------------------

@app.post("/categories", response_model=CategoryResponse)
def create_category(
    category: CategorySchema,
    db: Session = Depends(get_db)
):

    # Check if category name already exists
    existing_category = db.query(Category).filter(
        Category.name == category.name
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=409,
            detail="Category already exists"
        )

    # Create new Category object
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


# ---------------------------------------------------------
# GET ALL CATEGORIES
# GET /categories
# ---------------------------------------------------------

@app.get(
    "/categories",
    response_model=list[CategoryResponse]
)
def get_categories(
    db: Session = Depends(get_db)
):

    categories = db.query(Category).all()

    return categories


# ---------------------------------------------------------
# GET SINGLE CATEGORY
# GET /categories/{category_id}
# ---------------------------------------------------------

@app.get(
    "/categories/{category_id}",
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
            detail="Category Not Found"
        )

    return category


# ---------------------------------------------------------
# UPDATE CATEGORY
# PUT /categories/{category_id}
# ---------------------------------------------------------

@app.put(
    "/categories/{category_id}",
    response_model=CategoryResponse
)
def update_category(
    category_id: int,
    category: CategorySchema,
    db: Session = Depends(get_db)
):

    # Find existing category
    existing_category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not existing_category:
        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )
        
    # Check whether another category already
    # has the same name
    duplicate_category = db.query(Category).filter(
        Category.name == category.name,
        Category.id != category_id
    ).first()

    if duplicate_category:
        raise HTTPException(
            status_code=409,
            detail="Category name already exists"
        )

    # Update category
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


# ---------------------------------------------------------
# DELETE SINGLE CATEGORY
# DELETE /categories/{category_id}
# ---------------------------------------------------------

@app.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):

    # Find category
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )

    # Check whether any products use this category
    product_count = db.query(Product).filter(
        Product.category_id == category_id
    ).count()

    if product_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete category because products are using it"
        )

    # Delete category
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


# ---------------------------------------------------------
# DELETE ALL CATEGORIES
# DELETE /categories
# ---------------------------------------------------------

@app.delete("/categories")
def delete_all_categories(
    db: Session = Depends(get_db)
):

    # Check whether products exist
    product_count = db.query(Product).count()

    if product_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete categories while products exist"
        )

    # Delete all categories
    db.query(Category).delete()

    try:
        db.commit()

        # Reset AUTO_INCREMENT
        db.execute(
            text("ALTER TABLE categories AUTO_INCREMENT = 1")
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
    
    
# =====================================================
# STATUS API
# =====================================================


# -----------------------------------------------------
# GET ALL STATUSES
# GET /status
# -----------------------------------------------------

@app.get("/status")
def get_statuses(
    db: Session = Depends(get_db)
):

    statuses = db.query(
        Status
    ).all()

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


# -----------------------------------------------------
# UPDATE PRODUCT STATUS
# PUT /products/{product_id}/status
# -----------------------------------------------------

@app.put("/products/{product_id}/status")
def update_product_status(
    product_id: int,
    status_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------
    # FIND PRODUCT
    # -----------------------------------------------

    product = db.query(
        Product
    ).filter(
        Product.id == product_id
    ).first()

    if not product:

        raise HTTPException(
            status_code=404,
            detail="Product Not Found"
        )


    # -----------------------------------------------
    # FIND STATUS
    # -----------------------------------------------

    status = db.query(
        Status
    ).filter(
        Status.id == status_id
    ).first()

    if not status:

        raise HTTPException(
            status_code=404,
            detail="Status Not Found"
        )


    # -----------------------------------------------
    # UPDATE STATUS
    # -----------------------------------------------

    product.status_id = status_id


    # -----------------------------------------------
    # SAVE DATABASE
    # -----------------------------------------------

    try:

        db.commit()

        db.refresh(product)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update product status"
        )


    # -----------------------------------------------
    # RESPONSE
    # -----------------------------------------------

    return {
        "message": "Product Status Updated",
        "data": {
            "product_id": product.id,
            "status_id": status.id,
            "status": status.name
        }
    }    
    
# =========================================================
# PRODUCT CRUD
# =========================================================


# ---------------------------------------------------------
# CREATE PRODUCT
# POST /products
# ---------------------------------------------------------

@app.post("/products")
def create_product(
    product: ProductSchema,
    db: Session = Depends(get_db)
):

    # Check that the category exists
    category = db.query(Category).filter(
        Category.id == product.category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )

    # Create Product
    new_product = Product(

    name=product.name,

    price=product.price,

    quantity=product.quantity,

    category_id=product.category_id,

    status=product.status
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
            "category_name": category.name
        }
    }


# ---------------------------------------------------------
# GET ALL PRODUCTS
# GET /products
# ---------------------------------------------------------

@app.get("/products")
def get_products(
    db: Session = Depends(get_db)
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
# ---------------------------------------------------------
# GET SINGLE PRODUCT
# GET /products/{product_id}
# ---------------------------------------------------------

@app.get("/products/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product Not Found"
        )

    return {
        "message": "Product Found",
        "data": {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "quantity": product.quantity,
            "category_id": product.category_id,
            "category_name": product.category.name
        }
    }


# ---------------------------------------------------------
# UPDATE PRODUCT
# PUT /products/{product_id}
# ---------------------------------------------------------

@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductSchema,
    db: Session = Depends(get_db)
):

    # Find existing product
    existing_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product Not Found"
        )

    # Check that the new category exists
    category = db.query(Category).filter(
        Category.id == product.category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category Not Found"
        )

    # Update product
    existing_product.name = product.name
    
    existing_product.price = product.price
    
    existing_product.quantity = product.quantity
    
    existing_product.category_id = product.category_id
    
    existing_product.status = product.status

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
            "status": existing_product.status
        }
    }

# =========================================================
# UPDATE PRODUCT STATUS
# PUT /products/{product_id}/status
# =========================================================

@app.put("/products/{product_id}/status")
def update_product_status(

    product_id: int,

    status: str,

    db: Session = Depends(get_db)

):

    # -----------------------------------------------------
    # FIND PRODUCT
    # -----------------------------------------------------

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()


    if not product:

        raise HTTPException(
            status_code=404,
            detail="Product Not Found"
        )


    # -----------------------------------------------------
    # ALLOWED STATUSES
    # -----------------------------------------------------

    allowed_statuses = [

        "Order Accepted",

        "Order Rejected",

        "Shipped",

        "Out for Delivery",

        "Delivered"

    ]


    # -----------------------------------------------------
    # CHECK STATUS
    # -----------------------------------------------------

    if status not in allowed_statuses:

        raise HTTPException(

            status_code=400,

            detail={
                "message": "Invalid status",

                "allowed_statuses":
                    allowed_statuses
            }

        )


    # -----------------------------------------------------
    # UPDATE STATUS
    # -----------------------------------------------------

    product.status = status


    # -----------------------------------------------------
    # SAVE DATABASE
    # -----------------------------------------------------

    try:

        db.commit()

        db.refresh(product)

    except Exception:

        db.rollback()

        raise HTTPException(

            status_code=500,

            detail="Failed to update product status"

        )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "message":
            "Product status updated successfully",

        "data": {

            "id":
                product.id,

            "status":
                product.status

        }

    }
# ---------------------------------------------------------
# DELETE SINGLE PRODUCT
# DELETE /products/{product_id}
# ---------------------------------------------------------

@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
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


# ---------------------------------------------------------
# DELETE ALL PRODUCTS
# DELETE /products
# ---------------------------------------------------------

@app.delete("/products")
def delete_all_products(
    db: Session = Depends(get_db)
):

    db.query(Product).delete()

    try:
        db.commit()

        # Reset AUTO_INCREMENT
        db.execute(
            text("ALTER TABLE products AUTO_INCREMENT = 1")
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
    
    
# =========================================================
# PRODUCT IMAGE API
# =========================================================


# ---------------------------------------------------------
# UPLOAD PRODUCT IMAGE
# POST /products/{product_id}/images
# ---------------------------------------------------------

@app.post("/products/{product_id}/images")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # Find the product
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product Not Found"
        )

    # Read the uploaded image
    image_data = await file.read()

    # Create ProductImage
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

       print("IMAGE UPLOAD ERROR:", e)

       raise HTTPException(
          status_code=500,
          detail=str(e)
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
    
# =========================================================
# GET PRODUCT IMAGE
# =========================================================


# ---------------------------------------------------------
# GET IMAGE
# GET /images/{image_id}
# ---------------------------------------------------------

@app.get("/images/{image_id}")
def get_image(
    image_id: int,
    db: Session = Depends(get_db)
):

    # Find the image
    image = db.query(ProductImage).filter(
        ProductImage.id == image_id
    ).first()

    # If image does not exist
    if not image:
        raise HTTPException(
            status_code=404,
            detail="Image Not Found"
        )

    # Return the actual image
    return Response(
        content=image.image_data,
        media_type=image.content_type
    )
    
     
# =========================================================
# DELETE PRODUCT IMAGE
# =========================================================

   
@app.delete("/images/{image_id}")
def delete_image(
    image_id: int,
    db: Session = Depends(get_db)
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