from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_db
from app.models.auth import User
from app.schemas.results_history import (
    HistoryResponse,
    ResultResponse
)
from app.services import results_history as service


router = APIRouter(
    prefix="/api/interviews",
    tags=["Results & History"]
)


# API lấy lịch sử phỏng vấn
@router.get("/history", response_model=HistoryResponse)
def interview_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_history(db, current_user)


# API lấy kết quả chi tiết một phiên
@router.get("/{session_id}/result", response_model=ResultResponse)
def interview_result(
    session_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_result(
        db,
        current_user,
        session_id
    )
