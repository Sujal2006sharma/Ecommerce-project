from sqlalchemy import (
    Column,
    Integer,
    Float,
    ForeignKey
)

from sqlalchemy.orm import relationship

from backend.database.db import Base


# =====================================================
# ORDER ITEM MODEL
# =====================================================

class OrderItem(Base):

    __tablename__ = "order_items"

    # =================================================
    # ID
    # =================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =================================================
    # ORDER
    # =================================================

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    # =================================================
    # PRODUCT
    # =================================================

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    # =================================================
    # QUANTITY
    # =================================================

    quantity = Column(
        Integer,
        nullable=False
    )

    # =================================================
    # PRICE
    # =================================================

    price = Column(
        Float,
        nullable=False
    )

    # =================================================
    # ORDER RELATIONSHIP
    # =================================================

    order = relationship(
        "Order",
        back_populates="items"
    )

    # =================================================
    # PRODUCT RELATIONSHIP
    # =================================================

    product = relationship(
        "Product"
    )