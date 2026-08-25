from backend.database.db import SessionLocal
from backend.models.user import User
from backend.models.role import Role
from backend.core.security import hash_password


def create_user(
    username: str,
    email: str,
    password: str,
    role_name: str
):

    db = SessionLocal()

    try:

        # =============================================
        # FIND ROLE
        # =============================================

        role = db.query(Role).filter(
            Role.name == role_name
        ).first()

        if not role:
            print(f"Role '{role_name}' does not exist.")
            return

        # =============================================
        # CHECK USERNAME
        # =============================================

        existing_user = db.query(User).filter(
            User.username == username
        ).first()

        if existing_user:
            print("Username already exists.")
            return

        # =============================================
        # CHECK EMAIL
        # =============================================

        existing_email = db.query(User).filter(
            User.email == email
        ).first()

        if existing_email:
            print("Email already exists.")
            return

        # =============================================
        # HASH PASSWORD
        # =============================================

        hashed_password = hash_password(password)

        # =============================================
        # CREATE USER
        # =============================================

        user = User(
            username=username,
            email=email,
            password=hashed_password,
            is_active=True,
            role_id=role.id
        )

        db.add(user)

        db.commit()

        db.refresh(user)

        print("======================================")
        print("USER CREATED SUCCESSFULLY")
        print("======================================")
        print(f"ID       : {user.id}")
        print(f"Username : {user.username}")
        print(f"Email    : {user.email}")
        print(f"Role     : {role.name}")
        print("======================================")

    except Exception as e:

        db.rollback()

        print("ERROR:", e)

    finally:

        db.close()


# =====================================================
# CREATE FIRST SUPERADMIN
# =====================================================

if __name__ == "__main__":

    create_user(
        username="superadmin",
        email="superadmin@example.com",
        password="SuperAdmin@123",
        role_name="SUPERADMIN"
    )
