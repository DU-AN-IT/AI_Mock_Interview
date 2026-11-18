from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.interview import InterviewLevel, InterviewSession, JobPosition, InterviewQuestion, InterviewAnswer
from app.models.auth import User
from app.schemas.interview import CreateSessionRequest, CreateSessionResponse, SessionDataResponse
from app.services.gemini import generate_interview_questions


def create_new_interview_session(db: Session, current_user: User, payload: CreateSessionRequest) -> CreateSessionResponse:
    position_obj = db.query(JobPosition).filter(JobPosition.position_id == payload.position_id).first() if payload.position_id is not None else None
    if position_obj is None and payload.position:
        position_obj = db.query(JobPosition).filter(JobPosition.position_name.ilike(payload.position.strip())).first()
    if not position_obj:
        raise HTTPException(status_code=400, detail="Vị trí ứng tuyển không hợp lệ.")

    level_obj = db.query(InterviewLevel).filter(InterviewLevel.level_id == payload.level_id).first() if payload.level_id is not None else None
    if level_obj is None and payload.level:
        level_obj = db.query(InterviewLevel).filter(InterviewLevel.level_name.ilike(payload.level.strip())).first()
    if not level_obj:
        raise HTTPException(status_code=400, detail="Cấp độ phỏng vấn không hợp lệ.")

    new_session = InterviewSession(user_id=current_user.user_id, position_id=position_obj.position_id, level_id=level_obj.level_id, status="CREATED")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return CreateSessionResponse(message="Khởi tạo phiên phỏng vấn thành công.", data=SessionDataResponse(
        session_id=new_session.session_id, user_id=new_session.user_id,
        position_id=position_obj.position_id, position_name=position_obj.position_name,
        level_id=level_obj.level_id, level_name=level_obj.level_name,
        status=new_session.status, started_at=new_session.started_at))


def generate_questions_for_session(db: Session, current_user: User, session_id: int):
    session = db.query(InterviewSession).filter(InterviewSession.session_id == session_id, InterviewSession.user_id == current_user.user_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên phỏng vấn.")
    existing = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session_id).order_by(InterviewQuestion.question_order).all()
    if existing:
        return existing
    position = db.query(JobPosition).filter(JobPosition.position_id == session.position_id).first()
    level = db.query(InterviewLevel).filter(InterviewLevel.level_id == session.level_id).first()
    texts = generate_interview_questions(position.position_name, level.level_name)
    questions = [InterviewQuestion(session_id=session_id, question_text=value, question_order=index + 1) for index, value in enumerate(texts)]
    db.add_all(questions)
    session.status = "IN_PROGRESS"
    db.commit()
    for question in questions:
        db.refresh(question)
    return questions


def save_answer(db: Session, current_user: User, session_id: int, question_id: int, answer_text: str):
    if not answer_text or not answer_text.strip():
        raise HTTPException(status_code=422, detail="Câu trả lời không được để trống.")

    question = db.query(InterviewQuestion).join(InterviewSession).filter(
        InterviewQuestion.question_id == question_id,
        InterviewQuestion.session_id == session_id,
        InterviewSession.user_id == current_user.user_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi thuộc phiên phỏng vấn này.")
    answer = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == question_id).first()
    if answer:
        answer.answer_text = answer_text.strip()
    else:
        answer = InterviewAnswer(question_id=question_id, answer_text=answer_text.strip())
        db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


def complete_interview_session(db: Session, current_user: User, session_id: int):
    session = db.query(InterviewSession).filter(
        InterviewSession.session_id == session_id,
        InterviewSession.user_id == current_user.user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên phỏng vấn.")

    session.status = "COMPLETED"
    session.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session
