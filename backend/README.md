# 🚀 AI Mock Interview - Backend Service

Hệ thống Backend xây dựng trên nền tảng **FastAPI (Python)** kết hợp **MySQL** và **Google Gemini API**, cung cấp toàn bộ RESTful API cho hệ thống luyện tập và đánh giá phỏng vấn tự động.

---

## 🛠️ 1. Công nghệ sử dụng

- **FastAPI:** Framework web hiệu năng cao, hỗ trợ Async/Await, tự động sinh Swagger UI.
- **SQLAlchemy ORM:** Quản lý cơ sở dữ liệu quan hệ, tự động đồng bộ hóa bảng.
- **Pydantic v2:** Kiểm tra (validate) kiểu dữ liệu đầu vào và định hình phản hồi (schemas).
- **PyMySQL:** Driver kết nối MySQL.
- **Passlib & PyJWT:** Băm mật khẩu an toàn với Bcrypt và mã hóa Access Token theo chuẩn JWT.
- **Google Gemini API (httpx):** Tích hợp đa mô hình AI (`gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-3.5-flash`, `gemini-2.5-flash`) để sinh câu hỏi và chấm điểm rubric tự động.

---

## 📦 2. Cài đặt và Khởi chạy

### Bước 1: Chuẩn bị MySQL
Khởi động MySQL trong XAMPP (hoặc MySQL Server độc lập). Tạo cơ sở dữ liệu:

```sql
CREATE DATABASE IF NOT EXISTS ai_mock_interview
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Thiết lập môi trường ảo
Mở terminal tại thư mục `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

*(Hoặc nhấp đúp vào `setup_backend.bat` để cài đặt tự động).*

### Bước 3: Cấu hình file `.env`
Tạo file `.env` từ `.env.example`:

```env
DATABASE_URL=mysql+pymysql://root:123456@127.0.0.1:3306/ai_mock_interview?charset=utf8mb4
SECRET_KEY=ptit-ai-mock-interview-secret-key-2026-super-secure
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.5-flash-lite
```

### Bước 4: Chạy máy chủ phát triển
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

*(Hoặc nhấp đúp vào `run_backend.bat`).*

- **API Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`
- **Health Check:** `http://127.0.0.1:8000/health` và `http://127.0.0.1:8000/health/db`

---

## 📑 3. Danh mục API Endpoints

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/register`: Đăng ký tài khoản ứng viên mới.
* `POST /api/auth/login`: Xác thực thông tin đăng nhập và trả về Bearer JWT Token.

### 🎯 Interview Sessions (`/api/interviews`)
* `POST /api/interviews`: Tạo phiên phỏng vấn mới theo `position_id` và `level_id`.
* `POST /api/interviews/{session_id}/questions/generate`: Gemini AI sinh bộ 5 câu hỏi phỏng vấn theo vị trí và cấp độ.
* `GET /api/interviews/{session_id}`: Lấy thông tin phiên, danh sách câu hỏi và trạng thái hoàn thành.
* `POST /api/interviews/{session_id}/answers`: Ứng viên nộp câu trả lời; Gemini AI phân tích và chấm điểm theo 4 tiêu chí rubric.

### 📊 Results & History (`/api/interviews`)
* `GET /api/interviews/{session_id}/result`: Lấy tổng kết kết quả phiên (điểm trung bình, radar chart metrics, điểm mạnh, điểm cần cải thiện, câu trả lời mẫu).
* `GET /api/interviews/history`: Lấy danh sách lịch sử tất cả các phiên phỏng vấn của ứng viên.

---

## 🛡️ 4. Cơ chế Xử lý Lỗi & Dự phòng AI

1. **Cơ chế Fallback Mô hình Gemini:**
   - Hệ thống tự động xoay vòng các mô hình: `gemini-3.5-flash-lite` ➔ `gemini-3.8-flash` ➔ `gemini-3.5-flash` ➔ `gemini-2.5-flash`.
   - Nếu gặp lỗi 503 (quá tải máy chủ AI) hoặc giới hạn quota, hệ thống sẽ tự động thử lại mô hình tiếp theo mà không làm gián đoạn trải nghiệm người dùng.
2. **Ngăn chặn ghi đè câu trả lời:**
   - Nếu ứng viên nộp lại câu trả lời cho câu hỏi đã được đánh giá, API trả về HTTP `409 Conflict` để bảo toàn điểm số và feedback trước đó.
3. **Bộ câu hỏi dự phòng cục bộ:**
   - Trường hợp mất kết nối mạng hoặc chưa cấu hình API key, hệ thống kích hoạt bộ câu hỏi dự phòng chuyên môn được tích hợp sẵn.
