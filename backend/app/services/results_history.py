from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.auth import User

from app.models.interview import (
    InterviewAnswer,
    InterviewLevel,
    InterviewQuestion,
    InterviewSession,
    JobPosition,
)

from app.schemas.results_history import (
    AnswerDetail,
    HistoryItem,
    HistoryResponse,
    ResultData,
    ResultResponse,
)


# Chỉ lấy phiên của người đang đăng nhập
def _owned_sessions(db: Session, current_user: User):
    return db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.user_id
    )


# Lấy tên vị trí và cấp độ
def _names(db: Session, session: InterviewSession):
    position = db.query(JobPosition).filter(
        JobPosition.position_id == session.position_id
    ).first()

    level = db.query(InterviewLevel).filter(
        InterviewLevel.level_id == session.level_id
    ).first()

    return (
        position.position_name if position else "Không rõ",
        level.level_name if level else "Không rõ"
    )


# =========================================================
# API 1: LẤY LỊCH SỬ PHỎNG VẤN
# =========================================================

def get_history(
    db: Session,
    current_user: User
) -> HistoryResponse:

    sessions = _owned_sessions(
        db,
        current_user
    ).order_by(
        InterviewSession.started_at.desc(),
        InterviewSession.session_id.desc()
    ).all()

    items = []

    for session in sessions:
        position, level = _names(db, session)

        items.append(
            HistoryItem(
                session_id=session.session_id,
                position=position,
                level=level,
                status=session.status,
                started_at=session.started_at,
                completed_at=session.completed_at,
                score=None
            )
        )

    return HistoryResponse(data=items)


# =========================================================
# API 2: LẤY KẾT QUẢ CHI TIẾT
# =========================================================

def get_result(
    db: Session,
    current_user: User,
    session_id: int
) -> ResultResponse:

    # Chỉ tìm phiên thuộc người đang đăng nhập
    session = _owned_sessions(
        db,
        current_user
    ).filter(
        InterviewSession.session_id == session_id
    ).first()

    # Không tìm thấy hoặc không thuộc tài khoản
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy kết quả phỏng vấn."
        )

    # Lấy thông tin vị trí và cấp độ
    position, level = _names(db, session)

    # Lấy danh sách câu hỏi
    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.session_id
    ).order_by(
        InterviewQuestion.question_order.asc()
    ).all()

    # Lấy danh sách câu trả lời
    answers = db.query(InterviewAnswer).filter(
        InterviewAnswer.session_id == session.session_id
    ).all()

    # Ghép câu trả lời theo question_id
    answer_map = {
        answer.question_id: answer
        for answer in answers
    }

    details = []

    for question in questions:
        answer = answer_map.get(question.question_id)

        details.append(
            AnswerDetail(
                question_id=question.question_id,
                question_order=question.question_order,
                question_content=question.question_content,

                answer_content=(
                    answer.answer_content
                    if answer else None
                ),

                submitted_at=(
                    answer.submitted_at
                    if answer else None
                )
            )
        )

    return ResultResponse(
        data=ResultData(
            session_id=session.session_id,
            position=position,
            level=level,
            status=session.status,
            started_at=session.started_at,
            completed_at=session.completed_at,

            score=None,
            feedback=None,

            questions=details
        )
    )
