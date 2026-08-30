from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote_plus

# =====================================================
# DATABASE CONFIGURATION
# =====================================================

user = "root"
password = quote_plus("Sujal@2642347054#")  # Converts '@' to %40 and '#' to %23
host = "127.0.0.1"                          # Forces TCP/IP connection on Windows
port = "3306"
db_name = "product_db"

DATABASE_URL = f"mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}"

# =====================================================
# DATABASE ENGINE & SESSION
# =====================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()