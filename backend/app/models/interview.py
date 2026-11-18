from datetime import datetime
from sqlalchemy import BigInteger, Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.auth import Base

BIGINT_PRIMARY_KEY = BigInteger().with_variant(Integer, "sqlite")

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
    session_id = Column(BIGINT_PRIMARY_KEY, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    position_id = Column(Integer, ForeignKey("job_positions.position_id"), nullable=False)
    level_id = Column(Integer, ForeignKey("interview_levels.level_id"), nullable=False)
    status = Column(Enum("CREATED", "IN_PROGRESS", "COMPLETED", "EVALUATED", name="session_status"), nullable=False, default="CREATED")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"
    question_id = Column(BIGINT_PRIMARY_KEY, primary_key=True, autoincrement=True)
    session_id = Column(BigInteger, ForeignKey("interview_sessions.session_id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_order = Column(Integer, nullable=False)
    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("session_id", "question_order", name="uq_session_question_order"),)

class InterviewAnswer(Base):
    __tablename__ = "interview_answers"
    answer_id = Column(BIGINT_PRIMARY_KEY, primary_key=True, autoincrement=True)
    question_id = Column(BigInteger, ForeignKey("interview_questions.question_id", ondelete="CASCADE"), nullable=False, unique=True)
    answer_text = Column(Text, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    question = relationship("InterviewQuestion", back_populates="answer")
