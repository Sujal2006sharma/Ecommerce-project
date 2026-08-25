from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from backend.database.db import Base


# =====================================================
# CATEGORY MODEL
# =====================================================

class Category(Base):

    __tablename__ = "categories"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False,
        unique=True
    )

    description = Column(
        String(255),
        nullable=True
    )

    # =================================================
    # RELATIONSHIP
    # =================================================

    products = relationship(
        "Product",
        back_populates="category"
    )