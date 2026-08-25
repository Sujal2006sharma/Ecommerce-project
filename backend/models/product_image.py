from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.mysql import MEDIUMBLOB
from sqlalchemy.orm import relationship

from backend.database.db import Base


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

    # =================================================
    # RELATIONSHIP
    # =================================================

    product = relationship(
        "Product",
        back_populates="images"
    )