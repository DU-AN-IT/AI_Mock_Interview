import json
import re
import httpx
from fastapi import HTTPException, status
from app.core.config import settings


def generate_interview_questions(position: str, level: str) -> list[str]:
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Backend chưa cấu hình GEMINI_API_KEY trong file .env.")

    prompt = f'''Bạn là chuyên gia tuyển dụng. Hãy tạo đúng 5 câu hỏi phỏng vấn bằng tiếng Việt cho vị trí {position}, cấp độ {level}. Câu hỏi phải phù hợp cấp độ, không trùng lặp, tăng dần độ chuyên môn. Chỉ trả về JSON hợp lệ dạng {{"questions": ["câu 1", "câu 2", "câu 3", "câu 4", "câu 5"]}}, không thêm markdown hay giải thích.'''
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
    try:
        response = httpx.post(
            url,
            params={"key": settings.GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.7, "responseMimeType": "application/json"}},
            timeout=45.0,
        )
        response.raise_for_status()
        body = response.json()
        raw_text = body["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_text)
        questions = parsed.get("questions", [])
        questions = [re.sub(r"^\s*\d+[.)-]\s*", "", str(q)).strip() for q in questions]
        questions = [q for q in questions if q]
        if len(questions) != 5:
            raise ValueError("Gemini không trả về đủ 5 câu hỏi")
        return questions
    except httpx.HTTPStatusError as exc:
        detail = "Gemini API từ chối yêu cầu. Hãy kiểm tra API key, hạn mức và tên model."
        raise HTTPException(status_code=502, detail=detail) from exc
    except (httpx.HTTPError, KeyError, IndexError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Không thể tạo bộ câu hỏi từ Gemini. Vui lòng thử lại.") from exc
