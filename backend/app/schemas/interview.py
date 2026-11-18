from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CreateSessionRequest(BaseModel):
    position: Optional[str] = None
    level: Optional[str] = None
    position_id: Optional[int] = None
    level_id: Optional[int] = None

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

class QuestionItem(BaseModel):
    question_id: int
    question_order: int
    question_text: str

class GenerateQuestionsResponse(BaseModel):
    success: bool = True
    message: str
    session_id: int
    questions: list[QuestionItem]

class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer_text: str = Field(..., min_length=1, max_length=10000)

class SubmitAnswerResponse(BaseModel):
    success: bool = True
    message: str
    answer_id: int
    question_id: int
