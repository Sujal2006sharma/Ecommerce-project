from backend.database.db import SessionLocal

from backend.models.permission import Permission


# =====================================================
# DEFAULT PERMISSIONS
# =====================================================

DEFAULT_PERMISSIONS = [

    # -------------------------------------------------
    # USERS
    # -------------------------------------------------

    "VIEW_USERS",
    "CREATE_USERS",
    "UPDATE_USERS",
    "DELETE_USERS",


    # -------------------------------------------------
    # ROLES
    # -------------------------------------------------

    "VIEW_ROLES",
    "UPDATE_ROLE_PERMISSIONS",


    # -------------------------------------------------
    # PRODUCTS
    # -------------------------------------------------

    "VIEW_PRODUCTS",
    "CREATE_PRODUCTS",
    "UPDATE_PRODUCTS",
    "DELETE_PRODUCTS",


    # -------------------------------------------------
    # CATEGORIES
    # -------------------------------------------------

    "VIEW_CATEGORIES",
    "CREATE_CATEGORIES",
    "UPDATE_CATEGORIES",
    "DELETE_CATEGORIES",


    # -------------------------------------------------
    # STATUS
    # -------------------------------------------------

    "VIEW_STATUS",
    "UPDATE_STATUS"

]


# =====================================================
# CREATE DEFAULT PERMISSIONS
# =====================================================

def create_default_permissions():

    db = SessionLocal()

    try:

        for permission_name in DEFAULT_PERMISSIONS:

            # -----------------------------------------
            # CHECK IF ALREADY EXISTS
            # -----------------------------------------

            existing_permission = db.query(
                Permission
            ).filter(
                Permission.name == permission_name
            ).first()


            if existing_permission:

                print(
                    f"Permission already exists: "
                    f"{permission_name}"
                )

                continue


            # -----------------------------------------
            # CREATE PERMISSION
            # -----------------------------------------

            permission = Permission(
                name=permission_name
            )

            db.add(permission)

            print(
                f"Permission created: "
                f"{permission_name}"
            )


        # ---------------------------------------------
        # SAVE ALL NEW PERMISSIONS
        # ---------------------------------------------

        db.commit()


        print("\n======================================")
        print("DEFAULT PERMISSIONS READY")
        print("======================================")


    except Exception as error:

        db.rollback()

        print(
            "ERROR CREATING PERMISSIONS:",
            error
        )


    finally:

        db.close()


# =====================================================
# RUN SCRIPT
# =====================================================

if __name__ == "__main__":

    create_default_permissions()