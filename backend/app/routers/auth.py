from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_db
from app.schemas.auth import AuthResponse, UserLoginRequest, UserRegisterRequest
from app.services import auth as auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register_new_user(db=db, payload=payload)


@router.post("/login", response_model=AuthResponse, status_code=status.HTTP_200_OK)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    return auth_service.authenticate_user(db=db, payload=payload)