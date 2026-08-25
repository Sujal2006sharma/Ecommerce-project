from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.dialects.mysql import MEDIUMBLOB
from sqlalchemy.orm import relationship

from db import Base


# =====================================================
# CATEGORY MODEL
# =====================================================

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(255), nullable=True)

    products = relationship(
        "Product",
        back_populates="category"
    )
    

# =====================================================
# STATUS MODEL
# =====================================================

class Status(Base):

    __tablename__ = "status"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        unique=True,
        nullable=False
    )


# =====================================================
# PRODUCT MODEL
# =====================================================
    
    
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(100),
        nullable=False
    )

    price = Column(
        Float,
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )

    status = Column(
        String(50),
        nullable=False,
        default="Order Accepted"
    )

    category = relationship(
        "Category",
        back_populates="products"
    )

    images = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan"
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
    # RELATIONSHIPS
    # =================================================

    category = relationship(
        "Category"
    )

    images = relationship(
        "ProductImage",
        back_populates="product"
    )

    status = relationship(
        "Status"
    )
    
    

# =====================================================
# PRODUCT IMAGE MODEL
# =====================================================


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    filename = Column(
        String(255),
        nullable=False
    )

    content_type = Column(
        String(100),
        nullable=False
    )

    image_data = Column(
        MEDIUMBLOB,
        nullable=False
    )

    product = relationship(
        "Product",
        back_populates="images"
    )