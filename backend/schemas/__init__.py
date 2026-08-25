# =====================================================
# IMPORT ALL SCHEMAS
# =====================================================


# =====================================================
# PRODUCT
# =====================================================

from backend.schemas.product import (
    ProductSchema,
    ProductResponse
)


# =====================================================
# CATEGORY
# =====================================================

from backend.schemas.category import (
    CategorySchema,
    CategoryResponse
)


# =====================================================
# STATUS
# =====================================================

from backend.schemas.status import (
    StatusSchema,
    StatusResponse
)


# =====================================================
# PRODUCT IMAGE
# =====================================================

from backend.schemas.product_image import (
    ProductImageResponse
)


# =====================================================
# USER
# =====================================================

from backend.schemas.user import (
    UserCreate,
    UserResponse
)


# =====================================================
# AUTHENTICATION
# =====================================================

from backend.schemas.auth import (
    LoginRequest,
    TokenResponse,
    AuthUserResponse
)


# =====================================================
# ROLE
# =====================================================

from backend.schemas.role import (
    RoleSchema,
    RoleResponse
)


# =====================================================
# PERMISSION
# =====================================================

from backend.schemas.permission import (
    PermissionSchema,
    PermissionResponse
)


# =====================================================
# ORDER
# =====================================================

from backend.schemas.order import (
    OrderCreate,
    OrderItemCreate,
    OrderResponse,
    OrderItemResponse,
    OrderStatusUpdate
)


# =====================================================
# PUBLIC SCHEMAS
# =====================================================

__all__ = [

    # -------------------------------------------------
    # PRODUCT
    # -------------------------------------------------

    "ProductSchema",
    "ProductResponse",

    # -------------------------------------------------
    # CATEGORY
    # -------------------------------------------------

    "CategorySchema",
    "CategoryResponse",

    # -------------------------------------------------
    # STATUS
    # -------------------------------------------------

    "StatusSchema",
    "StatusResponse",

    # -------------------------------------------------
    # PRODUCT IMAGE
    # -------------------------------------------------

    "ProductImageResponse",

    # -------------------------------------------------
    # USER
    # -------------------------------------------------

    "UserCreate",
    "UserResponse",

    # -------------------------------------------------
    # AUTHENTICATION
    # -------------------------------------------------

    "LoginRequest",
    "TokenResponse",
    "AuthUserResponse",

    # -------------------------------------------------
    # ROLE
    # -------------------------------------------------

    "RoleSchema",
    "RoleResponse",

    # -------------------------------------------------
    # PERMISSION
    # -------------------------------------------------

    "PermissionSchema",
    "PermissionResponse",

    # -------------------------------------------------
    # ORDER
    # -------------------------------------------------

    "OrderCreate",
    "OrderItemCreate",
    "OrderResponse",
    "OrderItemResponse",
    "OrderStatusUpdate"
]