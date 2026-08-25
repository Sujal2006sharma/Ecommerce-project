from pydantic import BaseModel


# =====================================================
# ROLE SCHEMA
# =====================================================

class RoleSchema(BaseModel):

    name: str


# =====================================================
# ROLE RESPONSE
# =====================================================

class RoleResponse(BaseModel):

    id: int

    name: str

    class Config:
        from_attributes = True


# =====================================================
# ROLE PERMISSIONS UPDATE
# =====================================================

class RolePermissionsUpdate(BaseModel):

    permission_ids: list[int]


# =====================================================
# PERMISSION RESPONSE FOR ROLE
# =====================================================

class RolePermissionResponse(BaseModel):

    id: int

    name: str

    class Config:
        from_attributes = True