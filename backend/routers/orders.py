from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from backend.database.db import get_db

from backend.models.order import Order
from backend.models.order_item import OrderItem
from backend.models.product import Product
from backend.models.status import Status
from backend.models.user import User

from backend.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate
)

from backend.core.dependencies import require_roles


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


# =====================================================
# HELPER: Build Order Response
# Includes Real Customer Profile & Shipping Information
# =====================================================

def build_order_response(order):

    return {
        "id": order.id,

        "user_id": order.user_id,

        "username": (
            order.user.username
            if order.user
            else None
        ),

        "email": (
            order.user.email
            if order.user
            else None
        ),

        # REAL CUSTOMER CHECKOUT DATA
        "customer_name": getattr(order, "customer_name", None) or (order.user.username if order.user else "Customer"),

        "customer_email": getattr(order, "customer_email", None) or (order.user.email if order.user else None),

        "customer_phone": getattr(order, "customer_phone", None),

        "shipping_address": getattr(order, "shipping_address", None),

        "total_amount": order.total_amount,

        "status_id": order.status_id,

        "status": (
            order.status.name
            if order.status
            else None
        ),

        "created_at": order.created_at,

        "items": [
            {
                "id": item.id,

                "product_id": item.product_id,

                "product_name": (
                    item.product.name
                    if item.product
                    else None
                ),

                "quantity": item.quantity,

                "price": item.price

            }
            for item in order.items
        ]
    }


# =====================================================
# CREATE ORDER
# POST /orders
# =====================================================

@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "CUSTOMER",
            "ADMIN",
            "SUPERADMIN"
        )
    )
):
    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one product"
        )

    # Instantiate Order with real customer data fields
    new_order = Order(
        user_id=current_user.id,
        total_amount=0,
        status_id=None
    )

    # Attach customer metadata dynamically if model columns exist
    if hasattr(new_order, "customer_name"):
        new_order.customer_name = getattr(order_data, "customer_name", None) or current_user.username
    if hasattr(new_order, "customer_email"):
        new_order.customer_email = getattr(order_data, "customer_email", None) or current_user.email
    if hasattr(new_order, "customer_phone"):
        new_order.customer_phone = getattr(order_data, "customer_phone", None)
    if hasattr(new_order, "shipping_address"):
        new_order.shipping_address = getattr(order_data, "shipping_address", None)

    db.add(new_order)
    db.flush()

    # DEFAULT ORDER STATUS
    order_status = (
        db.query(Status)
        .filter(Status.name.ilike("Order accepted"))
        .first()
    )

    if not order_status:
        order_status = db.query(Status).first()

    if order_status:
        new_order.status_id = order_status.id

    total_amount = 0

    # PROCESS EACH PRODUCT
    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()

        if not product:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found"
            )

        if item.quantity <= 0:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be greater than 0"
            )

        if product.quantity < item.quantity:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}'. Available: {product.quantity}"
            )

        item_price = float(product.price)
        item_total = item_price * item.quantity
        total_amount += item_total

        # REDUCE INVENTORY STOCK
        product.quantity -= item.quantity

        # AUTOMATIC RESTOCK TRIGGER IF PRODUCT HITS 0 OR LESS
        if product.quantity <= 0:
            product.quantity = 10  # Instantly replenishes back to 10 units

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price=item_price
        )
        db.add(order_item)

    new_order.total_amount = total_amount

    try:
        db.commit()
        db.refresh(new_order)
    except Exception as error:
        db.rollback()
        print("CREATE ORDER ERROR:", error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order"
        )

    return build_order_response(new_order)


# =====================================================
# GET ORDERS (UNIFIED ROUTE)
# GET /orders
# =====================================================

@router.get(
    "",
    response_model=list[OrderResponse]
)
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "CUSTOMER",
            "ADMIN",
            "SUPERADMIN"
        )
    )
):
    user_role = current_user.role.name.upper() if (hasattr(current_user, 'role') and current_user.role) else "CUSTOMER"

    if user_role in ["ADMIN", "SUPERADMIN"]:
        orders = (
            db.query(Order)
            .order_by(Order.created_at.desc())
            .all()
        )
    else:
        orders = (
            db.query(Order)
            .filter(Order.user_id == current_user.id)
            .order_by(Order.created_at.desc())
            .all()
        )

    return [build_order_response(order) for order in orders]


# =====================================================
# ADMIN GET ALL ORDERS ALIAS
# GET /orders/admin/all
# =====================================================

@router.get(
    "/admin/all",
    response_model=list[OrderResponse]
)
def get_admin_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "SUPERADMIN"
        )
    )
):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [build_order_response(order) for order in orders]


# =====================================================
# GET MY ORDERS ALIAS
# GET /orders/user/my-orders
# =====================================================

@router.get(
    "/user/my-orders",
    response_model=list[OrderResponse]
)
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "CUSTOMER",
            "ADMIN",
            "SUPERADMIN"
        )
    )
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return [build_order_response(order) for order in orders]


# =====================================================
# GET SINGLE ORDER
# GET /orders/{order_id}
# =====================================================

@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "CUSTOMER",
            "ADMIN",
            "SUPERADMIN"
        )
    )
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    user_role = current_user.role.name.upper() if (hasattr(current_user, 'role') and current_user.role) else "CUSTOMER"

    if user_role == "CUSTOMER" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own orders"
        )

    return build_order_response(order)


# =====================================================
# UPDATE ORDER STATUS & RESTOCK ON CANCEL
# PUT /orders/{order_id}/status
# =====================================================

@router.put(
    "/{order_id}/status",
    response_model=OrderResponse
)
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "SUPERADMIN"
        )
    )
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    order_status = db.query(Status).filter(Status.id == status_data.status_id).first()

    if not order_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found"
        )

    # AUTOMATIC RESTOCK ON CANCELLATION
    if order_status.name.lower() == "cancelled" and (not order.status or order.status.name.lower() != "cancelled"):
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity  # Add items back into stock count

    order.status_id = order_status.id

    try:
        db.commit()
        db.refresh(order)
    except Exception as error:
        db.rollback()
        print("UPDATE ORDER STATUS ERROR:", error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order status"
        )

    return build_order_response(order)


# =====================================================
# DELETE ORDER
# DELETE /orders/{order_id}
# Allowed for ADMIN & SUPERADMIN
# =====================================================

@router.delete(
    "/{order_id}"
)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "SUPERADMIN"
        )
    )
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    try:
        db.delete(order)
        db.commit()
    except Exception as error:
        db.rollback()
        print("DELETE ORDER ERROR:", error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete order"
        )

    return {"message": "Order deleted successfully"}