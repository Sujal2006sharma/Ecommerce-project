from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# MySQL Database URL
DATABASE_URL = "mysql+pymysql://root:root1@localhost/product_db"

# Create database engine
engine = create_engine(DATABASE_URL)

# Create database session - whenever api need database it creates new session
SessionLocal = sessionmaker(
    autocommit=False,#Dont automatically save changes
    autoflush=False,#Controls automatic sending of changes to database.
    bind=engine# coonect seesion with mysql
)
# Base class for database models
Base = declarative_base()


# # Database connection function
# get_db()
#     |
# Create Session
#     |
# Give to API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()