from datetime import datetime
from sqlalchemy import BigInteger, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from backend.app.models.auth import Base


class JobPosition(Base):
    __tablename__ = "job_positions"

    position_id = Column(Integer, primary_key=True, autoincrement=True)
    position_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)


class InterviewLevel(Base):
    __tablename__ = "interview_levels"

    level_id = Column(Integer, primary_key=True, autoincrement=True)
    level_name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    session_id = Column(BigInteger, primary_key=True, autoincrement=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False, index=True)
    position_id = Column(Integer, ForeignKey("job_positions.position_id"), nullable=False)
    level_id = Column(Integer, ForeignKey("interview_levels.level_id"), nullable=False)
    status = Column(
        Enum("CREATED", "IN_PROGRESS", "COMPLETED", "EVALUATED", name="session_status_enum"),
        nullable=False,
        default="CREATED"
    )
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)