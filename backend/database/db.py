from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# =====================================================
# DATABASE URL
# =====================================================

DATABASE_URL = "mysql+pymysql://root:root1@localhost/product_db"


# =====================================================
# DATABASE ENGINE
# =====================================================

engine = create_engine(
    DATABASE_URL
)


# =====================================================
# DATABASE SESSION
# =====================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =====================================================
# BASE
# =====================================================

Base = declarative_base()


# =====================================================
# DATABASE DEPENDENCY
# =====================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()