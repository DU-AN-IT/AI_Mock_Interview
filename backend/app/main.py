from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import SessionLocal, engine
from app.models.auth import Base, User
from app.models.interview import (
    InterviewAnswer,
    InterviewLevel,
    InterviewQuestion,
    InterviewSession,
    JobPosition,
)
from app.routers import auth, interview, results_history

Base.metadata.create_all(bind=engine)


def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(JobPosition).count() == 0:
            db.add_all([
                JobPosition(position_id=1, position_name="Frontend", description="Phát triển giao diện người dùng HTML, CSS, JavaScript"),
                JobPosition(position_id=2, position_name="Backend", description="Xây dựng hệ thống REST API và xử lý cơ sở dữ liệu"),
                JobPosition(position_id=3, position_name="Tester", description="Kiểm thử phần mềm và đảm bảo chất lượng hệ thống"),
                JobPosition(position_id=4, position_name="BA", description="Phân tích nghiệp vụ và đặc tả yêu cầu phần mềm"),
            ])
        if db.query(InterviewLevel).count() == 0:
            db.add_all([
                InterviewLevel(level_id=1, level_name="Intern", description="Sinh viên thực tập nắm vững kiến thức nền tảng"),
                InterviewLevel(level_id=2, level_name="Fresher", description="Người mới tốt nghiệp có kỹ năng làm việc cơ bản"),
                InterviewLevel(level_id=3, level_name="Junior", description="Nhân sự có từ 1-2 năm kinh nghiệm thực tế"),
            ])
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


seed_initial_data()

app = FastAPI(
    title="AI Mock Interview API",
    version="1.0.0",
    description="Backend API cho hệ thống Phỏng vấn thử với AI",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


@app.get("/health/db", tags=["Health"])
def db_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(exc)}")


app.include_router(auth.router)
app.include_router(results_history.router)
app.include_router(interview.router)
