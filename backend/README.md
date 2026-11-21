# AI Mock Interview - Backend + Frontend

Dự án gồm FastAPI, MySQL, HTML/CSS/JavaScript và Gemini API. Phiên bản này hỗ trợ đăng ký/đăng nhập, tạo phiên phỏng vấn, Gemini sinh đúng 5 câu hỏi, đánh giá từng câu trả lời theo rubric, lưu điểm/nhận xét và đánh dấu phiên đã hoàn thành.

## 1. Chuẩn bị MySQL (XAMPP)

Bật MySQL trong XAMPP. Dự án đang cấu hình cổng `3307`, tài khoản `root`, mật khẩu trống theo thiết lập hiện tại của bạn. Trong phpMyAdmin, mở tab SQL và chạy:

```sql
CREATE DATABASE IF NOT EXISTS ai_mock_interview_gemini
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Nếu MySQL của bạn dùng cổng hoặc mật khẩu khác, hãy sửa `DATABASE_URL` trong `backend/.env`.

## 2. Cài đặt Backend trên Windows

Mở PowerShell tại thư mục dự án:

```powershell
cd F:\AI_MOCK_INTERVIEW\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Mở `backend/.env`, kiểm tra các dòng sau và thay Gemini API key bằng key của bạn (không chia sẻ key):

```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3307/ai_mock_interview_gemini?charset=utf8mb4
SECRET_KEY=thay_bang_chuoi_bi_mat_dai_va_ngau_nhien
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=API_KEY_GEMINI_CUA_BAN
GEMINI_MODEL=gemini-3.5-flash-lite
```

Gemini ưu tiên model `gemini-3.5-flash-lite`; nếu model này lỗi, hệ thống thử tiếp `gemini-3.8-flash`.

Chạy Backend (vẫn ở thư mục `backend`):

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Mở `http://127.0.0.1:8000/docs` để xem API. Kiểm tra `http://127.0.0.1:8000/health` và `http://127.0.0.1:8000/health/db`.

## 3. Chạy Frontend

Mở thư mục `frontend` bằng VS Code, dùng Live Server mở `index.html`. Nếu Live Server dùng cổng khác `5500` hoặc `5501`, thêm origin đó vào `allow_origins` trong `backend/app/main.py`. Backend API mặc định ở `http://127.0.0.1:8000`.

## 4. Luồng sử dụng

1. Đăng ký tài khoản tại `index.html`.
2. Đăng nhập để nhận JWT.
3. Chọn vị trí (Frontend/Backend/Tester/BA) và cấp độ (Intern/Fresher/Junior).
4. Mở phòng phỏng vấn. Backend tạo phiên và gọi Gemini tạo 5 câu hỏi.
5. Mỗi lần bấm câu tiếp theo, câu trả lời được gửi đến Backend và lưu trong MySQL. Có thể quay lại câu trước và cập nhật câu trả lời.
6. Khi kết thúc, Backend cập nhật trạng thái phiên thành `COMPLETED`.

## 5. Các bảng tự động tạo

Khi Backend khởi động và kết nối được MySQL, SQLAlchemy tạo các bảng `users`, `job_positions`, `interview_levels`, `interview_sessions`, `interview_questions`, `interview_answers`. Dữ liệu vị trí và cấp độ mẫu được thêm nếu bảng tương ứng đang trống.

Nếu đã có bảng `interview_answers` từ phiên bản trước, chạy lệnh sau một lần để bổ sung cột điểm và nhận xét:

```sql
ALTER TABLE interview_answers
ADD COLUMN score FLOAT NULL,
ADD COLUMN feedback TEXT NULL;
```

## 6. API chính

- `POST /api/auth/register` - đăng ký.
- `POST /api/auth/login` - đăng nhập.
- `POST /api/interviews` - tạo phiên phỏng vấn (cần Bearer token).
- `POST /api/interviews/{session_id}/questions/generate` - Gemini tạo/lấy 5 câu hỏi (cần Bearer token).
- `POST /api/interviews/{session_id}/answers` - gửi câu trả lời và rubric đến Gemini, lưu câu trả lời cùng điểm (0-10)/nhận xét (cần Bearer token). Nếu Gemini lỗi, API trả `503` và không lưu câu trả lời.
- `GET /api/interviews/{session_id}` - lấy câu hỏi, câu trả lời, điểm và nhận xét từng câu (cần Bearer token).
- `POST /api/interviews/{session_id}/complete` - kết thúc phiên (cần Bearer token).

Không đưa file `.env`, mật khẩu hoặc API key lên GitHub.
