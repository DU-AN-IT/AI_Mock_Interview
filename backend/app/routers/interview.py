from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.security import get_current_user, get_db
from app.models.auth import User
from app.schemas.interview import CreateSessionRequest, CreateSessionResponse, GenerateQuestionsResponse, QuestionItem, SubmitAnswerRequest, SubmitAnswerResponse
from app.services import interview as interview_service

router = APIRouter(prefix="/api/interviews", tags=["Interview Sessions"])

@router.post("", response_model=CreateSessionResponse, status_code=status.HTTP_201_CREATED)
def create_interview_session(payload: CreateSessionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return interview_service.create_new_interview_session(db=db, current_user=current_user, payload=payload)

@router.post("/{session_id}/questions/generate", response_model=GenerateQuestionsResponse)
def generate_questions(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    questions = interview_service.generate_questions_for_session(db, current_user, session_id)
    return {"message": "Đã tạo và lưu 5 câu hỏi thành công.", "session_id": session_id, "questions": [QuestionItem(question_id=q.question_id, question_order=q.question_order, question_text=q.question_text) for q in questions]}

@router.post("/{session_id}/answers", response_model=SubmitAnswerResponse)
def submit_answer(session_id: int, payload: SubmitAnswerRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    answer = interview_service.save_answer(db, current_user, session_id, payload.question_id, payload.answer_text)
    return {"message": "Đã lưu câu trả lời.", "answer_id": answer.answer_id, "question_id": answer.question_id}


@router.post("/{session_id}/complete")
def complete_interview(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = interview_service.complete_interview_session(db, current_user, session_id)
    return {"success": True, "message": "Đã kết thúc phiên phỏng vấn.", "session_id": session.session_id, "status": session.status}
