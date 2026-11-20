from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_db
from app.models.auth import User
from app.schemas.interview import (
    CreateSessionRequest,
    CreateSessionResponse,
    GenerateQuestionsResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services import interview as interview_service

router = APIRouter(prefix="/api/interviews", tags=["Interview Sessions"])


@router.post("", response_model=CreateSessionResponse, status_code=status.HTTP_201_CREATED)
def create_interview_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return interview_service.create_new_interview_session(
        db=db,
        current_user=current_user,
        payload=payload,
    )


@router.post(
    "/{session_id}/questions/generate",
    response_model=GenerateQuestionsResponse,
    status_code=status.HTTP_200_OK,
)
def generate_session_questions(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return interview_service.generate_questions_for_session(
        db=db,
        current_user=current_user,
        session_id=session_id,
    )


@router.get(
    "/{session_id}",
    response_model=CreateSessionResponse,
    status_code=status.HTTP_200_OK,
)
def get_interview_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return interview_service.get_interview_session_detail(
        db=db,
        current_user=current_user,
        session_id=session_id,
    )


@router.post(
    "/{session_id}/answers",
    response_model=SubmitAnswerResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_answer(
    session_id: int,
    payload: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return interview_service.submit_interview_answer(
        db=db,
        current_user=current_user,
        session_id=session_id,
        payload=payload,
    )