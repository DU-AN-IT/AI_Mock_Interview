import json
import logging
import re
from typing import List, Tuple

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

FALLBACK_QUESTIONS = {
    "Frontend": [
        "Hãy giải thích sự khác nhau giữa var, let và const trong JavaScript cùng khái niệm hoisting.",
        "Trình bày cách hoạt động của CSS Box Model và sự khác biệt giữa Flexbox với CSS Grid.",
        "Event Delegation trong JavaScript là gì và tại sao nó hữu ích khi làm việc với DOM động?",
        "So sánh localStorage, sessionStorage và Cookie khi lưu trữ dữ liệu phía trình duyệt.",
        "Trình bày cách tối ưu hiệu năng tải trang web thuần HTML/CSS/JavaScript.",
    ],
    "Backend": [
        "Giải thích kiến trúc RESTful API và sự khác biệt giữa các phương thức GET, POST, PUT, PATCH, DELETE.",
        "JWT (JSON Web Token) hoạt động như thế nào trong xác thực người dùng và cần lưu ý bảo mật gì?",
        "Phân biệt INNER JOIN, LEFT JOIN và cách đánh Index tối ưu truy vấn trong MySQL.",
        "Transaction và tính chất ACID trong cơ sở dữ liệu quan hệ có ý nghĩa gì?",
        "Giải thích cách xử lý lỗi tập trung và thiết kế mã trạng thái HTTP chuẩn (200, 201, 400, 401, 404, 409, 500).",
    ],
    "Tester": [
        "Phân biệt kiểm thử hộp đen (Black-box) và kiểm thử hộp trắng (White-box) kèm ví dụ thực tế.",
        "Trình bày các thành phần bắt buộc của một Bug Report chất lượng và vòng đời của một Bug.",
        "Kỹ thuật phân vùng tương đương và phân tích giá trị biên được áp dụng như thế nào khi viết Test Case?",
        "Phân biệt Smoke Testing, Sanity Testing và Regression Testing.",
        "Nếu có tính năng đăng nhập và tạo phiên phỏng vấn qua API, bạn sẽ kiểm thử những kịch bản nào?",
    ],
    "BA": [
        "Phân biệt Yêu cầu chức năng (Functional Requirements) và Yêu cầu phi chức năng (Non-Functional Requirements) kèm ví dụ.",
        "Trình bày cấu trúc của một tài liệu SRS và vai trò của nó đối với đội phát triển.",
        "Sự khác nhau giữa Use Case Diagram, Activity Diagram và Sequence Diagram là gì?",
        "Khi khách hàng liên tục thay đổi yêu cầu giữa Sprint, BA cần xử lý theo quy trình nào?",
        "Làm sao để xác định tiêu chí nghiệm thu (Acceptance Criteria) rõ ràng cho một chức năng web?",
    ],
}


def _extract_questions_from_text(raw_text: str) -> List[str]:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    parsed = json.loads(cleaned)
    if isinstance(parsed, dict) and isinstance(parsed.get("questions"), list):
        items = parsed["questions"]
    elif isinstance(parsed, list):
        items = parsed
    else:
        raise ValueError("Phản hồi Gemini không chứa danh sách questions hợp lệ.")

    questions: List[str] = []
    for item in items:
        if isinstance(item, str) and item.strip():
            questions.append(item.strip())
        elif isinstance(item, dict):
            content = item.get("content") or item.get("question") or item.get("question_content")
            if isinstance(content, str) and content.strip():
                questions.append(content.strip())

    if len(questions) != 5:
        raise ValueError(f"Gemini trả về {len(questions)} câu hỏi thay vì đúng 5 câu.")
    return questions


def _get_fallback_questions(position_name: str, level_name: str) -> List[str]:
    base_list = FALLBACK_QUESTIONS.get(position_name, FALLBACK_QUESTIONS["Backend"])
    return [f"[{position_name} - {level_name}] {q}" for q in base_list]


def generate_interview_questions(position_name: str, level_name: str) -> Tuple[List[str], str]:
    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY chưa được cấu hình. Dùng bộ câu hỏi dự phòng.")
        return _get_fallback_questions(position_name, level_name), "fallback"

    prompt = (
        f"Bạn là chuyên gia tuyển dụng CNTT. Hãy tạo ĐÚNG 5 câu hỏi phỏng vấn chuyên môn bằng tiếng Việt "
        f"cho ứng viên vị trí '{position_name}' ở cấp độ '{level_name}'.\n"
        "Yêu cầu:\n"
        "- Câu hỏi sát thực tế, có độ khó tăng dần từ cơ bản đến tình huống xử lý.\n"
        "- Phù hợp để ứng viên trả lời bằng văn bản.\n"
        "- Chỉ trả về JSON hợp lệ theo đúng cấu trúc sau, không thêm giải thích bên ngoài:\n"
        '{"questions": ["Câu hỏi 1", "Câu hỏi 2", "Câu hỏi 3", "Câu hỏi 4", "Câu hỏi 5"]}'
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "responseMimeType": "application/json",
        },
    }

    last_error = None
    with httpx.Client(timeout=30.0) as client:
        for model in GEMINI_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                response = client.post(url, params={"key": api_key}, json=payload)
                response.raise_for_status()
                data = response.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                questions = _extract_questions_from_text(raw_text)
                return questions, "gemini"
            except Exception as exc:
                last_error = exc
                logger.warning("Gọi Gemini model %s thất bại: %s", model, exc)

    logger.error("Tất cả lượt gọi Gemini API đều lỗi (%s). Chuyển sang fallback.", last_error)
    return _get_fallback_questions(position_name, level_name), "fallback"