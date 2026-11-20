from datetime import datetime
from typing import Dict, List

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.auth import User
from app.models.interview import (
    InterviewAnswer,
    InterviewLevel,
    InterviewQuestion,
    InterviewSession,
    JobPosition,
)
from app.schemas.interview import (
    AnswerDataResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    GenerateQuestionsResponse,
    QuestionItemResponse,
    SessionDataResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services.gemini import generate_interview_questions


def _get_owned_session(db: Session, current_user: User, session_id: int) -> InterviewSession:
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.session_id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy phiên phỏng vấn.",
        )
    if session.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập phiên phỏng vấn này.",
        )
    return session


def _build_question_items(db: Session, session_id: int) -> List[QuestionItemResponse]:
    questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.session_id == session_id)
        .order_by(InterviewQuestion.question_order.asc())
        .all()
    )
    answers = (
        db.query(InterviewAnswer)
        .filter(InterviewAnswer.session_id == session_id)
        .all()
    )
    answer_map: Dict[int, str] = {a.question_id: a.answer_content for a in answers}

    return [
        QuestionItemResponse(
            question_id=q.question_id,
            question_order=q.question_order,
            question_content=q.question_content,
            answer_content=answer_map.get(q.question_id),
            answered=q.question_id in answer_map,
        )
        for q in questions
    ]


def generate_questions_for_session(
    db: Session, current_user: User, session_id: int
) -> GenerateQuestionsResponse:
    session = _get_owned_session(db, current_user, session_id)

    existing_questions = _build_question_items(db, session.session_id)
    if len(existing_questions) == 5:
        return GenerateQuestionsResponse(
            message="Phiên phỏng vấn đã có đủ 5 câu hỏi.",
            session_id=session.session_id,
            status=session.status,
            ai_source="database",
            questions=existing_questions,
        )

    position_obj = (
        db.query(JobPosition)
        .filter(JobPosition.position_id == session.position_id)
        .first()
    )
    level_obj = (
        db.query(InterviewLevel)
        .filter(InterviewLevel.level_id == session.level_id)
        .first()
    )

    question_texts, ai_source = generate_interview_questions(
        position_name=position_obj.position_name if position_obj else "Backend",
        level_name=level_obj.level_name if level_obj else "Fresher",
    )

    try:
        if existing_questions:
            db.query(InterviewQuestion).filter(
                InterviewQuestion.session_id == session.session_id
            ).delete()

        for idx, content in enumerate(question_texts, start=1):
            db.add(
                InterviewQuestion(
                    session_id=session.session_id,
                    question_order=idx,
                    question_content=content,
                )
            )

        session.status = "IN_PROGRESS"
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lưu câu hỏi vào cơ sở dữ liệu: {str(exc)}",
        )

    saved_questions = _build_question_items(db, session.session_id)
    return GenerateQuestionsResponse(
        message="Sinh và lưu 5 câu hỏi phỏng vấn thành công.",
        session_id=session.session_id,
        status=session.status,
        ai_source=ai_source,
        questions=saved_questions,
    )


def create_new_interview_session(
    db: Session,
    current_user: User,
    payload: CreateSessionRequest,
) -> CreateSessionResponse:
    position_obj = None
    if payload.position_id is not None:
        position_obj = (
            db.query(JobPosition)
            .filter(JobPosition.position_id == payload.position_id)
            .first()
        )
    elif payload.position:
        position_obj = (
            db.query(JobPosition)
            .filter(JobPosition.position_name.ilike(payload.position.strip()))
            .first()
        )

    if not position_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vị trí ứng tuyển không hợp lệ. Chỉ chấp nhận: Frontend, Backend, Tester, BA.",
        )

    level_obj = None
    if payload.level_id is not None:
        level_obj = (
            db.query(InterviewLevel)
            .filter(InterviewLevel.level_id == payload.level_id)
            .first()
        )
    elif payload.level:
        level_obj = (
            db.query(InterviewLevel)
            .filter(InterviewLevel.level_name.ilike(payload.level.strip()))
            .first()
        )

    if not level_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cấp độ phỏng vấn không hợp lệ. Chỉ chấp nhận: Intern, Fresher, Junior.",
        )

    new_session = InterviewSession(
        user_id=current_user.user_id,
        position_id=position_obj.position_id,
        level_id=level_obj.level_id,
        status="CREATED",
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    generated = generate_questions_for_session(
        db=db,
        current_user=current_user,
        session_id=new_session.session_id,
    )
    db.refresh(new_session)

    return CreateSessionResponse(
        message="Khởi tạo phiên phỏng vấn và sinh 5 câu hỏi thành công.",
        data=SessionDataResponse(
            session_id=new_session.session_id,
            user_id=new_session.user_id,
            position_id=position_obj.position_id,
            position_name=position_obj.position_name,
            level_id=level_obj.level_id,
            level_name=level_obj.level_name,
            status=new_session.status,
            started_at=new_session.started_at,
            completed_at=new_session.completed_at,
            ai_source=generated.ai_source,
            questions=generated.questions,
        ),
    )


def get_interview_session_detail(
    db: Session, current_user: User, session_id: int
) -> CreateSessionResponse:
    session = _get_owned_session(db, current_user, session_id)
    position_obj = (
        db.query(JobPosition)
        .filter(JobPosition.position_id == session.position_id)
        .first()
    )
    level_obj = (
        db.query(InterviewLevel)
        .filter(InterviewLevel.level_id == session.level_id)
        .first()
    )
    questions = _build_question_items(db, session.session_id)

    return CreateSessionResponse(
        message="Lấy thông tin phiên phỏng vấn thành công.",
        data=SessionDataResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            position_id=session.position_id,
            position_name=position_obj.position_name if position_obj else "",
            level_id=session.level_id,
            level_name=level_obj.level_name if level_obj else "",
            status=session.status,
            started_at=session.started_at,
            completed_at=session.completed_at,
            questions=questions,
        ),
    )


def submit_interview_answer(
    db: Session,
    current_user: User,
    session_id: int,
    payload: SubmitAnswerRequest,
) -> SubmitAnswerResponse:
    session = _get_owned_session(db, current_user, session_id)

    if session.status not in ("IN_PROGRESS", "CREATED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phiên phỏng vấn đã hoàn tất, không thể gửi thêm câu trả lời.",
        )

    cleaned_answer = payload.answer_content.strip()
    if not cleaned_answer:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nội dung câu trả lời không được để trống.",
        )

    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.question_id == payload.question_id,
            InterviewQuestion.session_id == session.session_id,
        )
        .first()
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Câu hỏi không tồn tại trong phiên phỏng vấn này.",
        )

    existing_answer = (
        db.query(InterviewAnswer)
        .filter(InterviewAnswer.question_id == question.question_id)
        .first()
    )
    if existing_answer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Câu hỏi này đã được nộp câu trả lời trước đó.",
        )

    new_answer = InterviewAnswer(
        session_id=session.session_id,
        question_id=question.question_id,
        answer_content=cleaned_answer,
    )
    try:
        db.add(new_answer)
        db.flush()

        total_questions = (
            db.query(InterviewQuestion)
            .filter(InterviewQuestion.session_id == session.session_id)
            .count()
        )
        answered_count = (
            db.query(InterviewAnswer)
            .filter(InterviewAnswer.session_id == session.session_id)
            .count()
        )

        if total_questions > 0 and answered_count >= total_questions:
            session.status = "COMPLETED"
            session.completed_at = datetime.utcnow()

        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Câu hỏi này đã được nộp câu trả lời trước đó.",
        )

    db.refresh(new_answer)
    db.refresh(session)

    return SubmitAnswerResponse(
        message="Lưu câu trả lời thành công.",
        data=AnswerDataResponse(
            answer_id=new_answer.answer_id,
            session_id=session.session_id,
            question_id=question.question_id,
            answer_content=new_answer.answer_content,
            submitted_at=new_answer.submitted_at,
            answered_count=answered_count,
            total_questions=total_questions,
            session_status=session.status,
        ),
    )