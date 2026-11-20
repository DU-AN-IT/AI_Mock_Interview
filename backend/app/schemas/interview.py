from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    position: Optional[str] = Field(None, description="Tên vị trí: Frontend, Backend, Tester, BA")
    level: Optional[str] = Field(None, description="Tên cấp độ: Intern, Fresher, Junior")
    position_id: Optional[int] = Field(None, description="Mã vị trí (1-4)")
    level_id: Optional[int] = Field(None, description="Mã cấp độ (1-3)")


class QuestionItemResponse(BaseModel):
    question_id: int
    question_order: int
    question_content: str
    answer_content: Optional[str] = None
    answered: bool = False


class SessionDataResponse(BaseModel):
    session_id: int
    user_id: int
    position_id: int
    position_name: str
    level_id: int
    level_name: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    ai_source: Optional[str] = None
    questions: List[QuestionItemResponse] = Field(default_factory=list)


class CreateSessionResponse(BaseModel):
    success: bool = True
    message: str
    data: SessionDataResponse


class GenerateQuestionsResponse(BaseModel):
    success: bool = True
    message: str
    session_id: int
    status: str
    ai_source: str
    questions: List[QuestionItemResponse]


class SubmitAnswerRequest(BaseModel):
    question_id: int = Field(..., gt=0, description="Mã câu hỏi thuộc phiên phỏng vấn")
    answer_content: str = Field(..., min_length=1, description="Nội dung câu trả lời của ứng viên")


class AnswerDataResponse(BaseModel):
    answer_id: int
    session_id: int
    question_id: int
    answer_content: str
    submitted_at: datetime
    answered_count: int
    total_questions: int
    session_status: str


class SubmitAnswerResponse(BaseModel):
    success: bool = True
    message: str
    data: AnswerDataResponse