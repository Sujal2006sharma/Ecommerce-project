# E-Commerce Project (FastAPI + MySQL + Vanilla JS)

A full-stack multi-role e-commerce web application featuring role-based access control (RBAC), user authentication with JWT, product catalog management, order processing, and dynamic dashboard interfaces.

---

## 🛠 Tech Stack

- **Backend:** FastAPI, Python 3.11, SQLAlchemy, PyMySQL, Pydantic, Python-JOSE (JWT), BCrypt
- **Database:** MySQL / MariaDB (Database: `product_db`)
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Responsive Admin, Seller & Customer Portals)

---

## 🚀 Quick Start (Windows)

We have provided convenient launcher scripts in the root directory:

1. **Start Everything (Recommended):**
   Double-click `start_all.bat` or run:
   ```cmd
   start_all.bat
   ```

2. **Or Start Components Individually:**
   - **Start MySQL Server:** `start_mysql.bat`
   - **Start Backend API:** `start_backend.bat`
   - **Start Frontend:** `start_frontend.bat`

---

## 🔑 Default User Accounts

The database is pre-seeded with default demo users for all roles:

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **SUPERADMIN** | `superadmin` | `superadmin@example.com` | `SuperAdmin@123` |
| **ADMIN** | `admin` | `admin@example.com` | `Admin@123` |
| **SELLER** | `seller` | `seller@example.com` | `Seller@123` |
| **CUSTOMER** | `customer` | `customer@example.com` | `Customer@123` |

---

## 🌐 URLs & Access Points

- **Frontend Login:** [http://127.0.0.1:5500/auth/login.html](http://127.0.0.1:5500/auth/login.html)
- **Frontend Store:** [http://127.0.0.1:5500/index.html](http://127.0.0.1:5500/index.html)
- **SuperAdmin Dashboard:** [http://127.0.0.1:5500/superadmin/dashboard.html](http://127.0.0.1:5500/superadmin/dashboard.html)
- **Admin Dashboard:** [http://127.0.0.1:5500/admin/dashboard.html](http://127.0.0.1:5500/admin/dashboard.html)
- **Customer Dashboard:** [http://127.0.0.1:5500/customer/dashboard.html](http://127.0.0.1:5500/customer/dashboard.html)
- **Backend API Base:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Redoc API Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## ⚙️ Manual Setup & Re-seeding

If you ever need to re-initialize or seed the database from scratch:

```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run database table creation and initial seed script
python -m backend.utils.helpers

# Start backend server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 📁 Project Structure

```
Ecommerce-project/
├── backend/
│   ├── core/              # Security, JWT auth, RBAC dependencies
│   ├── database/          # SQLAlchemy database engine and session
│   ├── models/            # SQLAlchemy DB models (User, Role, Product, Order, etc.)
│   ├── routers/           # FastAPI API route handlers
│   ├── schemas/           # Pydantic validation schemas
│   ├── services/          # Business logic services
│   ├── utils/             # Database initialization and seeder scripts
│   └── main.py            # FastAPI main entrypoint
├── frontend/
│   ├── admin/             # Admin portal pages and scripts
│   ├── auth/              # Login and registration pages
│   ├── customer/          # Customer store and order history
│   ├── seller/            # Seller product catalog management
│   ├── superadmin/        # SuperAdmin RBAC, user, and role management
│   ├── shared/            # Shared authentication helper scripts
│   └── index.html         # Main storefront
├── requirements.txt       # Python dependencies
├── start_all.bat          # 1-Click launcher
├── start_backend.bat      # Backend launcher
├── start_frontend.bat     # Frontend HTTP server launcher
└── start_mysql.bat        # MySQL server launcher
```
