from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey
)

from sqlalchemy.orm import relationship

from backend.database.db import Base


# =====================================================
# PRODUCT MODEL
# =====================================================

class Product(Base):

    __tablename__ = "products"

    # =================================================
    # ID
    # =================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =================================================
    # NAME
    # =================================================

    name = Column(
        String(100),
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
    # QUANTITY
    # =================================================

    quantity = Column(
        Integer,
        nullable=False
    )

    # =================================================
    # CATEGORY
    # =================================================

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )

    # =================================================
    # STATUS
    # =================================================

    status_id = Column(
        Integer,
        ForeignKey("status.id"),
        nullable=True
    )
    
    status = relationship(
        "Status",
        back_populates="products"
    )

    # =================================================
    # CATEGORY RELATIONSHIP
    # =================================================

    category = relationship(
        "Category",
        back_populates="products"
    )

    # =================================================
    # IMAGE RELATIONSHIP
    # =================================================

    images = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan"
    )

    # =================================================
    # STATUS RELATIONSHIP
    # =================================================

    status = relationship(
        "Status",
        back_populates="products"
    )