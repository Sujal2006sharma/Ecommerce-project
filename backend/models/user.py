from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import relationship

from backend.database.db import Base


# =====================================================
# USER MODEL
# =====================================================

class User(Base):

    __tablename__ = "users"

    # =================================================
    # ID
    # =================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =================================================
    # USERNAME
    # =================================================

    username = Column(
        String(100),
        unique=True,
        nullable=False
    )

    # =================================================
    # EMAIL
    # =================================================

    email = Column(
        String(150),
        unique=True,
        nullable=False
    )

    # =================================================
    # PASSWORD
    # =================================================

    password = Column(
        String(255),
        nullable=False
    )

    # =================================================
    # ACTIVE STATUS
    # =================================================

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    # =================================================
    # ROLE
    # =================================================

    role_id = Column(
        Integer,
        ForeignKey("roles.id"),
        nullable=False
    )

    # =================================================
    # USER → ROLE
    # =================================================

    role = relationship(
        "Role",
        back_populates="users"
    )

    # =================================================
    # USER → ORDERS
    # =================================================
    #
    # One user can have many orders.
    #
    # Example:
    #
    # User 4
    #   ├── Order 1
    #   ├── Order 2
    #   └── Order 3
    #
    # =================================================

    orders = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan"
    )