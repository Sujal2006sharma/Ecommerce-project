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
# HELPER
# =====================================================
# Convert Order database object into the response format
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
#
# CUSTOMER:
#   Can create an order for themselves
#
# ADMIN:
#   Can also create order
#
# SUPERADMIN:
#   Can also create order
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

    # =================================================
    # CHECK ITEMS
    # =================================================

    if not order_data.items:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one product"
        )


    # =================================================
    # CREATE ORDER
    # =================================================

    new_order = Order(

        user_id=current_user.id,

        total_amount=0,

        status_id=None

    )

    db.add(new_order)

    db.flush()


    # =================================================
    # DEFAULT ORDER STATUS
    # =================================================

    order_status = (
        db.query(Status)
        .filter(
            Status.name.ilike("Order accepted")
        )
        .first()
    )


    # -------------------------------------------------
    # FALLBACK
    # -------------------------------------------------

    if not order_status:

        order_status = (
            db.query(Status)
            .first()
        )


    if order_status:

        new_order.status_id = order_status.id


    # =================================================
    # TOTAL
    # =================================================

    total_amount = 0


    # =================================================
    # PROCESS EACH PRODUCT
    # =================================================

    for item in order_data.items:

        # ---------------------------------------------
        # FIND PRODUCT
        # ---------------------------------------------

        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id
            )
            .first()
        )


        if not product:

            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Product {item.product_id} "
                    f"not found"
                )
            )


        # ---------------------------------------------
        # CHECK QUANTITY
        # ---------------------------------------------

        if item.quantity <= 0:

            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be greater than 0"
            )


        # ---------------------------------------------
        # CHECK STOCK
        # ---------------------------------------------

        if product.quantity < item.quantity:

            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for "
                    f"product '{product.name}'. "
                    f"Available stock: "
                    f"{product.quantity}"
                )
            )


        # ---------------------------------------------
        # PRODUCT PRICE
        # ---------------------------------------------

        item_price = float(
            product.price
        )


        # ---------------------------------------------
        # ITEM TOTAL
        # ---------------------------------------------

        item_total = (
            item_price *
            item.quantity
        )


        total_amount += item_total


        # ---------------------------------------------
        # REDUCE STOCK
        # ---------------------------------------------

        product.quantity -= item.quantity


        # ---------------------------------------------
        # CREATE ORDER ITEM
        # ---------------------------------------------

        order_item = OrderItem(

            order_id=new_order.id,

            product_id=product.id,

            quantity=item.quantity,

            price=item_price

        )

        db.add(order_item)


    # =================================================
    # SAVE TOTAL
    # =================================================

    new_order.total_amount = total_amount


    # =================================================
    # COMMIT
    # =================================================

    try:

        db.commit()

        db.refresh(new_order)

    except Exception as error:

        db.rollback()

        print(
            "CREATE ORDER ERROR:",
            error
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order"
        )


    return build_order_response(
        new_order
    )


# =====================================================
# GET ALL ORDERS
# GET /orders
#
# ADMIN
# SUPERADMIN
# =====================================================

@router.get(
    "",
    response_model=list[OrderResponse]
)
def get_orders(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            "ADMIN",
            "SUPERADMIN"
        )
    )
):

    orders = (
        db.query(Order)
        .order_by(
            Order.created_at.desc()
        )
        .all()
    )


    return [

        build_order_response(order)

        for order in orders

    ]


# =====================================================
# GET MY ORDERS
# GET /orders/user/my-orders
#
# CUSTOMER
# =====================================================

@router.get(
    "/user/my-orders",
    response_model=list[OrderResponse]
)
def get_my_orders(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            "CUSTOMER"
        )
    )
):

    orders = (
        db.query(Order)
        .filter(
            Order.user_id ==
            current_user.id
        )
        .order_by(
            Order.created_at.desc()
        )
        .all()
    )


    return [

        build_order_response(order)

        for order in orders

    ]


# =====================================================
# GET SINGLE ORDER
# GET /orders/{order_id}
#
# CUSTOMER
# ADMIN
# SUPERADMIN
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

    # =================================================
    # FIND ORDER
    # =================================================

    order = (
        db.query(Order)
        .filter(
            Order.id == order_id
        )
        .first()
    )


    if not order:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )


    # =================================================
    # CUSTOMER OWN ORDER CHECK
    # =================================================

    if (

        current_user.role.name.upper()
        == "CUSTOMER"

        and

        order.user_id !=
        current_user.id

    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can only view "
                "your own orders"
            )
        )


    return build_order_response(
        order
    )


# =====================================================
# UPDATE ORDER STATUS
# PUT /orders/{order_id}/status
#
# ADMIN
# SUPERADMIN
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

    # =================================================
    # FIND ORDER
    # =================================================

    order = (
        db.query(Order)
        .filter(
            Order.id == order_id
        )
        .first()
    )


    if not order:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )


    # =================================================
    # FIND STATUS
    # =================================================

    order_status = (
        db.query(Status)
        .filter(
            Status.id ==
            status_data.status_id
        )
        .first()
    )


    if not order_status:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found"
        )


    # =================================================
    # UPDATE STATUS
    # =================================================

    order.status_id = (
        order_status.id
    )


    # =================================================
    # COMMIT
    # =================================================

    try:

        db.commit()

        db.refresh(order)

    except Exception as error:

        db.rollback()

        print(
            "UPDATE ORDER STATUS ERROR:",
            error
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order status"
        )


    return build_order_response(
        order
    )


# =====================================================
# DELETE ORDER
# DELETE /orders/{order_id}
#
# SUPERADMIN ONLY
# =====================================================

@router.delete(
    "/{order_id}"
)
def delete_order(

    order_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            "SUPERADMIN"
        )
    )
):

    # =================================================
    # FIND ORDER
    # =================================================

    order = (
        db.query(Order)
        .filter(
            Order.id == order_id
        )
        .first()
    )


    if not order:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )


    # =================================================
    # DELETE
    # =================================================

    try:

        db.delete(order)

        db.commit()

    except Exception as error:

        db.rollback()

        print(
            "DELETE ORDER ERROR:",
            error
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete order"
        )


    return {
        "message": "Order deleted successfully"
    }