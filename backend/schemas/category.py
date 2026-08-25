from pydantic import (
    BaseModel,
    field_validator
)

from typing import Optional


# =====================================================
# CATEGORY CREATE / UPDATE
# =====================================================

class CategorySchema(BaseModel):

    name: str

    description: Optional[str] = None


    # =================================================
    # VALIDATE CATEGORY NAME
    # =================================================

    @field_validator("name")
    @classmethod
    def validate_name(
        cls,
        value
    ):

        # Remove extra spaces
        value = value.strip()


        # Empty name
        if not value:

            raise ValueError(
                "Category name cannot be empty"
            )


        # Must contain at least one letter
        if not any(
            character.isalpha()
            for character in value
        ):

            raise ValueError(
                "Category name must contain letters and cannot contain only numbers"
            )


        return value


    # =================================================
    # VALIDATE DESCRIPTION
    # =================================================

    @field_validator("description")
    @classmethod
    def validate_description(
        cls,
        value
    ):

        # Description is optional
        if value is None:

            return value


        # Remove spaces
        value = value.strip()


        # Empty description is allowed
        if not value:

            return None


        # Must contain at least one letter
        if not any(
            character.isalpha()
            for character in value
        ):

            raise ValueError(
                "Description must contain letters and cannot contain only numbers"
            )


        return value


# =====================================================
# CATEGORY RESPONSE
# =====================================================

class CategoryResponse(BaseModel):

    id: int

    name: str

    description: Optional[str] = None


    class Config:

        from_attributes = True