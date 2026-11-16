from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_db
from backend.app.models.auth import User
from app.schemas.interview import CreateSessionRequest, CreateSessionResponse
from app.services import interview_service

router = APIRouter(prefix="/api/interviews", tags=["Interview Sessions"])


@router.post("", response_model=CreateSessionResponse, status_code=status.HTTP_201_CREATED)
def create_interview_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return interview_service.create_new_interview_session(
        db=db,
        current_user=current_user,
        payload=payload
    )