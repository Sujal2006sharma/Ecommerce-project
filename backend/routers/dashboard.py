from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from backend.database.db import get_db
from backend.models import User, Product, Category, Order, Status
from backend.schemas.dashboard import DashboardStatistics, RecentOrderSchema, DailyRevenueSchema
from backend.core.dependencies import require_roles

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/stats",
    response_model=DashboardStatistics
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_roles("SUPERADMIN", "ADMIN"))
):
    # AGGREGATE COUNTS
    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    total_categories = db.query(Category).count()
    total_orders = db.query(Order).count()

    # TOTAL STOCK
    total_stock = (
        db.query(func.coalesce(func.sum(Product.quantity), 0)).scalar()
    )


    # TOTAL REVENUE
    total_revenue = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0)).scalar()
    )

    # ORDER STATUS COUNTS
    status_counts = (
        db.query(Status.name, func.count(Order.id))
        .outerjoin(Order, Order.status_id == Status.id)
        .group_by(Status.id, Status.name)
        .all()
    )
    status_dict = {name: count for name, count in status_counts}

    # RECENT ORDERS (Last 5)
    recent_orders_raw = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    recent_orders = []
    for o in recent_orders_raw:
        customer_name = o.user.email if (o.user and o.user.email) else f"User #{o.user_id}"
        status_name = o.status.name if o.status else "Pending"
        recent_orders.append(
            RecentOrderSchema(
                id=o.id,
                customer_name=customer_name,
                total_amount=float(o.total_amount),
                status=status_name,
                created_at=o.created_at
            )
        )

    # DAILY REVENUE (Grouped by Order Date)
    daily_rev_query = (
        db.query(
            cast(Order.created_at, Date).label("order_date"),
            func.sum(Order.total_amount).label("daily_total")
        )
        .group_by(cast(Order.created_at, Date))
        .order_by(cast(Order.created_at, Date).desc())
        .limit(7)
        .all()
    )

    daily_revenue = [
        DailyRevenueSchema(
            date=str(row.order_date),
            revenue=float(row.daily_total)
        )
        for row in reversed(daily_rev_query)
    ]

    return DashboardStatistics(
        total_users=total_users,
        total_products=total_products,
        total_categories=total_categories,
        total_stock=int(total_stock),
        total_orders=total_orders,
        total_revenue=float(total_revenue),
        pending_orders=status_dict.get("Pending", 0),
        accepted_orders=status_dict.get("Order Accepted", 0),
        rejected_orders=status_dict.get("Order Rejected", 0),
        shipped_orders=status_dict.get("Shipped", 0),
        out_for_delivery_orders=status_dict.get("Out for Delivery", 0),
        delivered_orders=status_dict.get("Delivered", 0),
        recent_orders=recent_orders,
        daily_revenue=daily_revenue
    )