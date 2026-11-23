from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


# Một phiên trong danh sách lịch sử
class HistoryItem(BaseModel):
    session_id: int
    position: str
    level: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    score: Optional[float] = None


# Response danh sách lịch sử
class HistoryResponse(BaseModel):
    success: bool = True
    data: List[HistoryItem] = Field(default_factory=list)


# Chi tiết câu hỏi và câu trả lời
class AnswerDetail(BaseModel):
    question_id: int
    question_order: int
    question_content: str
    answer_content: Optional[str] = None
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    model_answer: Optional[str] = None
    criteria_scores: Optional[Dict[str, float]] = None


# Thông tin kết quả chi tiết
class ResultData(BaseModel):
    session_id: int
    position: str
    level: str
    status: str

    started_at: datetime
    completed_at: Optional[datetime] = None

    score: Optional[float] = None
    feedback: Optional[str] = None

    radar_data: Optional[Dict[str, float]] = None

    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    questions: List[AnswerDetail] = Field(default_factory=list)


# Response kết quả chi tiết
class ResultResponse(BaseModel):
    success: bool = True
    data: ResultData
