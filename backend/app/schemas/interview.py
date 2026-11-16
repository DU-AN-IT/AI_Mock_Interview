from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    position: Optional[str] = Field(None, description="Tên vị trí: Frontend, Backend, Tester, BA")
    level: Optional[str] = Field(None, description="Tên cấp độ: Intern, Fresher, Junior")
    position_id: Optional[int] = Field(None, description="Mã vị trí (1-4)")
    level_id: Optional[int] = Field(None, description="Mã cấp độ (1-3)")


class SessionDataResponse(BaseModel):
    session_id: int
    user_id: int
    position_id: int
    position_name: str
    level_id: int
    level_name: str
    status: str
    started_at: datetime


class CreateSessionResponse(BaseModel):
    success: bool = True
    message: str
    data: SessionDataResponse