import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database.db import Base, engine

# =====================================================
# IMPORT ALL MODELS
# =====================================================
from backend.models import (
    Product,
    Category,
    ProductImage,
    Status,
    User,
    Role,
    Permission,
    role_permissions,
    Order,
    OrderItem
)

from backend.routers import (
    products_router,
    categories_router,
    images_router,
    status_router,
    auth_router,
    users_router,
    roles_router,
    permissions_router,
    orders_router,
    dashboard_router
)

# =====================================================
# CREATE FASTAPI APPLICATION
# =====================================================

app = FastAPI(
    title="NewProject API",
    version="1.0.0"
)

# =====================================================
# CORS MIDDLEWARE
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# MOUNT STATIC UPLOADS DIRECTORY
# =====================================================
# Ensures uploaded images are accessible at http://127.0.0.1:8000/uploads/filename.jpg

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# =====================================================
# FILE UPLOAD ENDPOINT
# =====================================================

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    Saves uploaded product images to disk and returns the accessible HTTP URL.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    file_extension = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"http://127.0.0.1:8000/uploads/{unique_filename}"
    return {"image_url": image_url}

# =====================================================
# CREATE DATABASE TABLES
# =====================================================

Base.metadata.create_all(bind=engine)

# =====================================================
# REGISTER ROUTERS
# =====================================================

app.include_router(products_router)
app.include_router(categories_router)
app.include_router(images_router)
app.include_router(status_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(roles_router)
app.include_router(permissions_router)
app.include_router(orders_router)
app.include_router(dashboard_router)

# =====================================================
# ROOT ROUTE
# =====================================================

@app.get("/")
def root():
    return {
        "message": "NewProject API is running"
    }