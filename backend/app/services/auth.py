from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.auth import User
from app.schemas.auth import AuthResponse, UserLoginRequest, UserRegisterRequest, UserResponse


def register_new_user(db: Session, payload: UserRegisterRequest) -> AuthResponse:
    normalized_email = payload.email.lower().strip()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email này đã được đăng ký. Vui lòng sử dụng email khác."
        )

    new_user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": str(new_user.user_id), "email": new_user.email}
    )

    return AuthResponse(
        message="Đăng ký tài khoản thành công.",
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )


def authenticate_user(db: Session, payload: UserLoginRequest) -> AuthResponse:
    normalized_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác."
        )

    access_token = create_access_token(
        data={"sub": str(user.user_id), "email": user.email}
    )

    return AuthResponse(
        message="Đăng nhập thành công.",
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )