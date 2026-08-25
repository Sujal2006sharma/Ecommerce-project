from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.order import Order
from backend.models.order_item import OrderItem
from backend.models.product import Product
from backend.models.status import Status


# =====================================================
# CREATE ORDER
# =====================================================

def create_order_service(
    db: Session,
    user_id: int,
    items
):

    # -------------------------------------------------
    # VALIDATE ITEMS
    # -------------------------------------------------

    if not items:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one product"
        )

    total_amount = 0

    order_items_data = []


    # -------------------------------------------------
    # CHECK PRODUCTS
    # -------------------------------------------------

    for item in items:

        # ---------------------------------------------
        # QUANTITY VALIDATION
        # ---------------------------------------------

        if item.quantity <= 0:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product quantity must be greater than 0"
            )


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

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found"
            )


        # ---------------------------------------------
        # CHECK STOCK
        # ---------------------------------------------

        if product.quantity < item.quantity:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for product "
                    f"'{product.name}'. "
                    f"Available stock: {product.quantity}"
                )
            )


        # ---------------------------------------------
        # PRICE AT PURCHASE TIME
        # ---------------------------------------------

        item_price = float(product.price)

        item_total = (
            item_price *
            item.quantity
        )


        # ---------------------------------------------
        # CALCULATE TOTAL
        # ---------------------------------------------

        total_amount += item_total


        # ---------------------------------------------
        # STORE ITEM DATA
        # ---------------------------------------------

        order_items_data.append(
            {
                "product": product,
                "quantity": item.quantity,
                "price": item_price
            }
        )


    # =================================================
    # FIND DEFAULT ORDER STATUS
    # =================================================

    default_status = (
        db.query(Status)
        .filter(
            Status.name.ilike("Order Accepted")
        )
        .first()
    )


    # =================================================
    # CREATE ORDER
    # =================================================

    order = Order(

        user_id=user_id,

        total_amount=total_amount,

        status_id=(
            default_status.id
            if default_status
            else None
        )
    )


    db.add(order)

    db.flush()


    # =================================================
    # CREATE ORDER ITEMS
    # =================================================

    for item_data in order_items_data:

        product = item_data["product"]

        quantity = item_data["quantity"]

        price = item_data["price"]


        # ---------------------------------------------
        # REDUCE PRODUCT STOCK
        # ---------------------------------------------

        product.quantity -= quantity


        # ---------------------------------------------
        # CREATE ORDER ITEM
        # ---------------------------------------------

        order_item = OrderItem(

            order_id=order.id,

            product_id=product.id,

            quantity=quantity,

            price=price
        )


        db.add(order_item)


    # =================================================
    # SAVE
    # =================================================

    try:

        db.commit()

        db.refresh(order)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order"
        )


    return order


# =====================================================
# GET ALL ORDERS
# =====================================================

def get_orders_service(
    db: Session
):

    return (
        db.query(Order)
        .order_by(
            Order.created_at.desc()
        )
        .all()
    )


# =====================================================
# GET SINGLE ORDER
# =====================================================

def get_order_service(
    db: Session,
    order_id: int
):

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


    return order


# =====================================================
# GET USER ORDERS
# =====================================================

def get_user_orders_service(
    db: Session,
    user_id: int
):

    return (
        db.query(Order)
        .filter(
            Order.user_id == user_id
        )
        .order_by(
            Order.created_at.desc()
        )
        .all()
    )


# =====================================================
# UPDATE ORDER STATUS
# =====================================================

def update_order_status_service(
    db: Session,
    order_id: int,
    status_id: int
):

    # -------------------------------------------------
    # FIND ORDER
    # -------------------------------------------------

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


    # -------------------------------------------------
    # FIND STATUS
    # -------------------------------------------------

    selected_status = (
        db.query(Status)
        .filter(
            Status.id == status_id
        )
        .first()
    )


    if not selected_status:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found"
        )


    # -------------------------------------------------
    # UPDATE STATUS
    # -------------------------------------------------

    order.status_id = selected_status.id


    # -------------------------------------------------
    # SAVE
    # -------------------------------------------------

    try:

        db.commit()

        db.refresh(order)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order status"
        )


    return order


# =====================================================
# DELETE ORDER
# =====================================================

def delete_order_service(
    db: Session,
    order_id: int
):

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


    try:

        db.delete(order)

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete order"
        )


    return {
        "message": "Order deleted successfully"
    }