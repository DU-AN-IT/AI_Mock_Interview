from datetime import datetime
from sqlalchemy import BigInteger, Column, DateTime, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()
BIGINT_PRIMARY_KEY = BigInteger().with_variant(Integer, "sqlite")

class User(Base):
    __tablename__ = "users"

    user_id = Column(BIGINT_PRIMARY_KEY, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)