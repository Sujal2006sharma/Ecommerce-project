from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from backend.database.db import Base
from backend.models.role_permission import role_permissions


# =====================================================
# PERMISSION MODEL
# =====================================================

class Permission(Base):

    __tablename__ = "permissions"

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

    # -------------------------------------------------
    # PERMISSION → ROLES
    # -------------------------------------------------

    roles = relationship(
        "Role",
        secondary=role_permissions,
        back_populates="permissions"
    )