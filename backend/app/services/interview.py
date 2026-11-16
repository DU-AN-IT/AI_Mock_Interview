from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.interview import InterviewLevel, InterviewSession, JobPosition
from backend.app.models.auth import User
from app.schemas.interview import CreateSessionRequest, CreateSessionResponse, SessionDataResponse


def create_new_interview_session(
    db: Session,
    current_user: User,
    payload: CreateSessionRequest
) -> CreateSessionResponse:
    position_obj = None
    if payload.position_id is not None:
        position_obj = db.query(JobPosition).filter(
            JobPosition.position_id == payload.position_id
        ).first()
    elif payload.position:
        position_obj = db.query(JobPosition).filter(
            JobPosition.position_name.ilike(payload.position.strip())
        ).first()

    if not position_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vị trí ứng tuyển không hợp lệ. Chỉ chấp nhận: Frontend, Backend, Tester, BA."
        )

    level_obj = None
    if payload.level_id is not None:
        level_obj = db.query(InterviewLevel).filter(
            InterviewLevel.level_id == payload.level_id
        ).first()
    elif payload.level:
        level_obj = db.query(InterviewLevel).filter(
            InterviewLevel.level_name.ilike(payload.level.strip())
        ).first()

    if not level_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cấp độ phỏng vấn không hợp lệ. Chỉ chấp nhận: Intern, Fresher, Junior."
        )

    new_session = InterviewSession(
        user_id=current_user.user_id,
        position_id=position_obj.position_id,
        level_id=level_obj.level_id,
        status="CREATED"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return CreateSessionResponse(
        message="Khởi tạo phiên phỏng vấn thành công.",
        data=SessionDataResponse(
            session_id=new_session.session_id,
            user_id=new_session.user_id,
            position_id=position_obj.position_id,
            position_name=position_obj.position_name,
            level_id=level_obj.level_id,
            level_name=level_obj.level_name,
            status=new_session.status,
            started_at=new_session.started_at
        )
    )