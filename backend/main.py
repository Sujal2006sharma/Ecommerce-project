from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.db import Base, engine

# =====================================================
# IMPORT ALL MODELS
# =====================================================
# This ensures SQLAlchemy knows about every table
# before Base.metadata.create_all() is executed.

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
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =====================================================
# CREATE DATABASE TABLES
# =====================================================

Base.metadata.create_all(
    bind=engine
)


# =====================================================
# REGISTER ROUTERS
# =====================================================

app.include_router(
    products_router
)

app.include_router(
    categories_router
)

app.include_router(
    images_router
)

app.include_router(
    status_router
)

app.include_router(
    auth_router
)

app.include_router(
    users_router
)

app.include_router(
    roles_router
)

app.include_router(
    permissions_router
)

app.include_router(
    orders_router
)

app.include_router(
    dashboard_router
)

# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():

    return {
        "message": "NewProject API is running"
    }