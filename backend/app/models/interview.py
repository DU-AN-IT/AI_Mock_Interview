from datetime import datetime
from sqlalchemy import BigInteger, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from app.models.auth import Base


class JobPosition(Base):
    __tablename__ = "job_positions"

    position_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    position_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)


class InterviewLevel(Base):
    __tablename__ = "interview_levels"

    level_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    level_name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    session_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    position_id = Column(Integer, ForeignKey("job_positions.position_id"), nullable=False)
    level_id = Column(Integer, ForeignKey("interview_levels.level_id"), nullable=False)
    status = Column(
        Enum("CREATED", "IN_PROGRESS", "COMPLETED", "EVALUATED", name="session_status"),
        nullable=False,
        default="CREATED"
    )
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)