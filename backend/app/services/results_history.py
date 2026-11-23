import json
from datetime import datetime
from typing import Dict, List, Tuple
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


def _owned_sessions(db: Session, current_user: User):
    return db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.user_id
    )


def _names(db: Session, session: InterviewSession) -> Tuple[str, str]:
    position = db.query(JobPosition).filter(
        JobPosition.position_id == session.position_id
    ).first()

    level = db.query(InterviewLevel).filter(
        InterviewLevel.level_id == session.level_id
    ).first()

    return (
        position.position_name if position else "Không rõ",
        level.level_name if level else "Không rõ",
    )


def _calculate_session_score(answers: List[InterviewAnswer]) -> float | None:
    valid_scores = [a.score for a in answers if a.score is not None]
    if not valid_scores:
        return None
    # Quy đổi điểm trung bình thang 10 sang thang 100 (làm tròn 1 chữ số thập phân)
    avg_10 = sum(valid_scores) / len(valid_scores)
    return round(avg_10 * 10, 1)


def _calculate_radar_data(answers: List[InterviewAnswer], overall_score: float | None) -> Dict[str, float]:
    totals = {"accuracy": 0.0, "completeness": 0.0, "clarity": 0.0, "examples": 0.0}
    counts = {"accuracy": 0, "completeness": 0, "clarity": 0, "examples": 0}

    for ans in answers:
        if not ans.criteria_scores:
            continue
        try:
            parsed = json.loads(ans.criteria_scores)
            if isinstance(parsed, dict):
                for k in totals.keys():
                    if k in parsed and isinstance(parsed[k], (int, float)):
                        totals[k] += float(parsed[k])
                        counts[k] += 1
        except Exception:
            pass

    has_recorded = any(counts[k] > 0 for k in totals.keys())
    if has_recorded:
        radar = {}
        for k in totals.keys():
            avg_val = totals[k] / counts[k] if counts[k] > 0 else 1.5
            radar[k] = round((avg_val / 2.5) * 100, 1)
        return radar

    if overall_score is not None:
        return {
            "accuracy": min(100.0, round(overall_score * 1.04, 1)),
            "completeness": min(100.0, round(overall_score * 0.98, 1)),
            "clarity": min(100.0, round(overall_score * 1.02, 1)),
            "examples": min(100.0, round(overall_score * 0.96, 1)),
        }

    return {
        "accuracy": 0.0,
        "completeness": 0.0,
        "clarity": 0.0,
        "examples": 0.0,
    }


def _extract_feedback_highlights(answers: List[InterviewAnswer]) -> Tuple[List[str], List[str]]:
    strengths = []
    weaknesses = []

    for idx, ans in enumerate(answers, start=1):
        if not ans.feedback:
            continue
        text = ans.feedback.strip()
        if "Điểm tốt:" in text and "Hướng cải thiện:" in text:
            parts = text.split("Hướng cải thiện:")
            good_part = parts[0].replace("Điểm tốt:", "").strip().strip(".-")
            improve_part = parts[1].strip().strip(".-")
            if good_part:
                strengths.append(f"Câu {idx}: {good_part}")
            if improve_part:
                weaknesses.append(f"Câu {idx}: {improve_part}")
        else:
            sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 5]
            if sentences:
                strengths.append(f"Câu {idx}: {sentences[0]}")
            if len(sentences) > 1:
                weaknesses.append(f"Câu {idx}: {sentences[1]}")

    if not strengths:
        strengths = [
            "Đã hoàn thành các câu hỏi phỏng vấn theo đúng yêu cầu.",
            "Nắm được các khái niệm cơ bản của vị trí ứng tuyển.",
        ]
    if not weaknesses:
        weaknesses = [
            "Cần đào sâu thêm ví dụ thực tế và giải pháp tối ưu hệ thống.",
            "Nên rèn luyện thêm kỹ năng diễn đạt súc tích và chuẩn thuật ngữ chuyên môn.",
        ]

    return strengths[:4], weaknesses[:4]


# =========================================================
# API 1: LẤY LỊCH SỬ PHỎNG VẤN
# =========================================================

def get_history(
    db: Session,
    current_user: User,
) -> HistoryResponse:
    sessions = _owned_sessions(
        db,
        current_user,
    ).order_by(
        InterviewSession.started_at.desc(),
        InterviewSession.session_id.desc(),
    ).all()

    items = []

    for session in sessions:
        position, level = _names(db, session)
        answers = db.query(InterviewAnswer).filter(
            InterviewAnswer.session_id == session.session_id
        ).all()
        score = _calculate_session_score(answers)

        items.append(
            HistoryItem(
                session_id=session.session_id,
                position=position,
                level=level,
                status=session.status,
                started_at=session.started_at,
                completed_at=session.completed_at,
                score=score,
            )
        )

    return HistoryResponse(data=items)


# =========================================================
# API 2: LẤY KẾT QUẢ CHI TIẾT
# =========================================================

def get_result(
    db: Session,
    current_user: User,
    session_id: int,
) -> ResultResponse:
    session = _owned_sessions(
        db,
        current_user,
    ).filter(
        InterviewSession.session_id == session_id
    ).first()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy kết quả phỏng vấn.",
        )

    position, level = _names(db, session)

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.session_id
    ).order_by(
        InterviewQuestion.question_order.asc()
    ).all()

    answers = db.query(InterviewAnswer).filter(
        InterviewAnswer.session_id == session.session_id
    ).all()

    answer_map = {
        answer.question_id: answer
        for answer in answers
    }

    details = []
    for question in questions:
        answer = answer_map.get(question.question_id)
        parsed_criteria = None
        if answer and answer.criteria_scores:
            try:
                parsed_criteria = json.loads(answer.criteria_scores)
            except Exception:
                pass

        details.append(
            AnswerDetail(
                question_id=question.question_id,
                question_order=question.question_order,
                question_content=question.question_content,
                answer_content=answer.answer_content if answer else None,
                submitted_at=answer.submitted_at if answer else None,
                score=answer.score if answer else None,
                feedback=answer.feedback if answer else None,
                model_answer=answer.model_answer if answer else None,
                criteria_scores=parsed_criteria,
            )
        )

    overall_score = _calculate_session_score(answers)
    strengths, weaknesses = _extract_feedback_highlights(answers)
    radar_data = _calculate_radar_data(answers, overall_score)

    if overall_score is not None:
        if overall_score >= 80:
            overall_feedback = (
                f"Kết quả xuất sắc ({overall_score}/100)! Bạn nắm rất vững kiến thức chuyên môn "
                f"cho vị trí {position} ({level}). Câu trả lời rõ ràng, có cấu trúc và ví dụ minh họa tốt."
            )
        elif overall_score >= 65:
            overall_feedback = (
                f"Kết quả khá tốt ({overall_score}/100). Bạn có nền tảng tốt cho vị trí {position} ({level}), "
                "tuy nhiên cần bổ sung thêm giải pháp thực tiễn và phương án xử lý trường hợp biên (edge cases)."
            )
        else:
            overall_feedback = (
                f"Kết quả đạt {overall_score}/100. Bạn cần ôn luyện thêm các kiến thức cốt lõi và "
                f"thực hành thêm các bài tập tình huống cho vị trí {position} ({level})."
            )
    else:
        overall_feedback = "Phiên phỏng vấn chưa hoàn thành các câu trả lời để chấm điểm tổng kết."

    return ResultResponse(
        data=ResultData(
            session_id=session.session_id,
            position=position,
            level=level,
            status=session.status,
            started_at=session.started_at,
            completed_at=session.completed_at,
            score=overall_score,
            feedback=overall_feedback,
            radar_data=radar_data,
            strengths=strengths,
            weaknesses=weaknesses,
            questions=details,
        )
    )
