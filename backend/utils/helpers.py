import os
import sys

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.database.db import Base, engine, SessionLocal
from backend.models import (
    Product,
    Category,
    ProductImage,
    Status,
    User,
    Role,
    Permission,
    Order,
    OrderItem
)
from backend.core.security import hash_password

DEFAULT_ROLES = ["SUPERADMIN", "ADMIN", "SELLER", "CUSTOMER"]

DEFAULT_PERMISSIONS = [
    "VIEW_USERS",
    "CREATE_USERS",
    "UPDATE_USERS",
    "DELETE_USERS",
    "VIEW_ROLES",
    "UPDATE_ROLE_PERMISSIONS",
    "VIEW_PRODUCTS",
    "CREATE_PRODUCTS",
    "UPDATE_PRODUCTS",
    "DELETE_PRODUCTS",
    "VIEW_CATEGORIES",
    "CREATE_CATEGORIES",
    "UPDATE_CATEGORIES",
    "DELETE_CATEGORIES",
    "VIEW_STATUS",
    "UPDATE_STATUS",
    "VIEW_ORDERS",
    "CREATE_ORDERS",
    "UPDATE_ORDERS",
]

DEFAULT_STATUSES = ["Active", "Inactive", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"]

DEFAULT_USERS = [
    {
        "username": "superadmin",
        "email": "superadmin@example.com",
        "password": "SuperAdmin@123",
        "role": "SUPERADMIN"
    },
    {
        "username": "admin",
        "email": "admin@example.com",
        "password": "Admin@123",
        "role": "ADMIN"
    },
    {
        "username": "seller",
        "email": "seller@example.com",
        "password": "Seller@123",
        "role": "SELLER"
    },
    {
        "username": "customer",
        "email": "customer@example.com",
        "password": "Customer@123",
        "role": "CUSTOMER"
    }
]

def init_and_seed():
    print("========================================")
    print("1. CREATING ALL DATABASE TABLES")
    print("========================================")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        print("\n========================================")
        print("2. SEEDING ROLES")
        print("========================================")
        role_map = {}
        for role_name in DEFAULT_ROLES:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.flush()
                print(f"Created role: {role_name}")
            else:
                print(f"Role exists: {role_name}")
            role_map[role_name] = role

        print("\n========================================")
        print("3. SEEDING PERMISSIONS")
        print("========================================")
        all_perms = []
        for perm_name in DEFAULT_PERMISSIONS:
            perm = db.query(Permission).filter(Permission.name == perm_name).first()
            if not perm:
                perm = Permission(name=perm_name)
                db.add(perm)
                db.flush()
                print(f"Created permission: {perm_name}")
            else:
                print(f"Permission exists: {perm_name}")
            all_perms.append(perm)

        # Assign all permissions to SUPERADMIN and ADMIN
        if "SUPERADMIN" in role_map:
            role_map["SUPERADMIN"].permissions = all_perms
        if "ADMIN" in role_map:
            admin_perms = [p for p in all_perms if "SUPERADMIN" not in p.name]
            role_map["ADMIN"].permissions = admin_perms

        print("\n========================================")
        print("4. SEEDING STATUS VALUES")
        print("========================================")
        for st_name in DEFAULT_STATUSES:
            st = db.query(Status).filter(Status.name == st_name).first()
            if not st:
                st = Status(name=st_name)
                db.add(st)
                print(f"Created status: {st_name}")
            else:
                print(f"Status exists: {st_name}")

        print("\n========================================")
        print("5. SEEDING DEFAULT USERS")
        print("========================================")
        for u_data in DEFAULT_USERS:
            user = db.query(User).filter(User.username == u_data["username"]).first()
            if not user:
                role = role_map.get(u_data["role"])
                user = User(
                    username=u_data["username"],
                    email=u_data["email"],
                    password=hash_password(u_data["password"]),
                    is_active=True,
                    role_id=role.id if role else None
                )
                db.add(user)
                print(f"Created user: {u_data['username']} ({u_data['role']})")
            else:
                print(f"User exists: {u_data['username']}")

        print("\n========================================")
        print("6. SEEDING SAMPLE CATEGORIES")
        print("========================================")
        sample_categories = ["Electronics", "Fashion & Apparel", "Home & Kitchen", "Books", "Beauty & Care"]
        for cat_name in sample_categories:
            cat = db.query(Category).filter(Category.name == cat_name).first()
            if not cat:
                cat = Category(name=cat_name, description=f"{cat_name} products category")
                db.add(cat)
                print(f"Created category: {cat_name}")
            else:
                print(f"Category exists: {cat_name}")

        db.commit()
        print("\n========================================")
        print("DATABASE INITIALIZATION & SEED COMPLETE")
        print("========================================")

    except Exception as e:
        db.rollback()
        print("Error seeding database:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_and_seed()
