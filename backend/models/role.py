from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from backend.database.db import Base
from backend.models.role_permission import role_permissions


# =====================================================
# ROLE MODEL
# =====================================================

class Role(Base):

    __tablename__ = "roles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(50),
        unique=True,
        nullable=False
    )

    # -------------------------------------------------
    # ROLE → USERS
    # -------------------------------------------------

    users = relationship(
        "User",
        back_populates="role"
    )

    # -------------------------------------------------
    # ROLE → PERMISSIONS
    # -------------------------------------------------

    permissions = relationship(
        "Permission",
        secondary=role_permissions,
        back_populates="roles"
    )