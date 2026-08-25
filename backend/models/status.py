from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from backend.database.db import Base


# =====================================================
# STATUS MODEL
# =====================================================

class Status(Base):

    __tablename__ = "status"

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
        unique=True,
        nullable=False
    )

    # =================================================
    # PRODUCT RELATIONSHIP
    # =================================================

    products = relationship(
        "Product",
        back_populates="status"
    )

    # =================================================
    # ORDER RELATIONSHIP
    # =================================================

    orders = relationship(
        "Order",
        back_populates="status"
    )