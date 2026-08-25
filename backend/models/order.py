from sqlalchemy import (
    Column,
    Integer,
    Float,
    ForeignKey,
    DateTime
)

from sqlalchemy.orm import relationship

from datetime import datetime

from backend.database.db import Base


# =====================================================
# ORDER MODEL
# =====================================================

class Order(Base):

    __tablename__ = "orders"

    # =================================================
    # ORDER ID
    # =================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =================================================
    # CUSTOMER
    # =================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # =================================================
    # TOTAL AMOUNT
    # =================================================

    total_amount = Column(
        Float,
        nullable=False,
        default=0
    )

    # =================================================
    # STATUS
    # =================================================

    status_id = Column(
        Integer,
        ForeignKey("status.id"),
        nullable=True
    )

    # =================================================
    # CREATED AT
    # =================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # =================================================
    # USER RELATIONSHIP
    # =================================================

    user = relationship(
        "User",
        back_populates="orders"
    )

    # =================================================
    # STATUS RELATIONSHIP
    # =================================================

    status = relationship(
        "Status",
        back_populates="orders"
    )

    # =================================================
    # ORDER ITEMS
    # =================================================

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )