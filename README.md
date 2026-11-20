# AI Mock Interview – Phỏng vấn thử với AI

Nền tảng web mô phỏng phỏng vấn chuyên ngành CNTT bằng văn bản (Text-based Mock Interview), giúp sinh viên IT và ứng viên mới ra trường luyện tập trả lời câu hỏi theo đúng vị trí tuyển dụng và cấp độ kinh nghiệm, tích hợp **Google Gemini API** để tự động sinh câu hỏi và hỗ trợ đánh giá chuyên môn.

---

## 1. Tính năng chính

- **Quản lý tài khoản & Xác thực (JWT):** Đăng ký tài khoản, đăng nhập, băm mật khẩu an toàn bằng `bcrypt` và xác thực phiên làm việc qua `Authorization: Bearer <token>`.
- **Thiết lập phiên phỏng vấn:** Lựa chọn 1 trong **4 vị trí** (`Frontend`, `Backend`, `Tester`, `BA`) và 1 trong **3 cấp độ** (`Intern`, `Fresher`, `Junior`).
- **Tích hợp AI sinh câu hỏi:** Kết nối **Google Gemini API** qua HTTPS để sinh đúng **5 câu hỏi** chuyên môn bằng tiếng Việt sát với vị trí và cấp độ đã chọn, lưu trực tiếp vào MySQL (có bộ câu hỏi dự phòng `fallback` khi chưa cấu hình API key hoặc lỗi mạng).
- **Phòng phỏng vấn & Gửi câu trả lời:** Hiển thị tiến độ 5 câu hỏi, đếm số từ, lưu nháp tự động khi chuyển câu, khóa gửi trùng lặp (`409 Conflict`), hiển thị trạng thái đang tải (Loading) và hỗ trợ thử gửi lại khi mất kết nối.
- **Vòng đời phiên phỏng vấn chuẩn hóa:** `CREATED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` $\rightarrow$ `EVALUATED`.
- **Định hướng mở rộng (Sprint 3):** Đánh giá câu trả lời tự động bằng Gemini API (thang điểm $0\text{--}10$), tổng hợp báo cáo điểm trung bình và quản lý lịch sử phỏng vấn cá nhân.

---

## 2. Kiến trúc hệ thống & Công nghệ sử dụng

Hệ thống được thiết kế theo **Kiến trúc 3 tầng (3-Tier Architecture)** kết hợp dịch vụ AI bên ngoài:

| Thành phần | Công nghệ sử dụng | Vai trò |
| :--- | :--- | :--- |
| **Presentation Tier (Frontend)** | HTML5, CSS3, JavaScript thuần (ES6+), Fetch API | Giao diện người dùng, kiểm tra dữ liệu phía Client, gọi REST API (không dùng ReactJS/Vue/Angular). |
| **Application Tier (Backend)** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, PyJWT, `bcrypt`, `httpx` | Xử lý nghiệp vụ, xác thực JWT, băm mật khẩu, quản lý phiên và giao tiếp với Gemini API. |
| **Data Tier (Database)** | MySQL 8.0+ (`utf8mb4_unicode_ci`) | Lưu trữ dữ liệu quan hệ chuẩn hóa gồm 8 bảng theo thiết kế ERD. |
| **External AI Service** | Google Gemini API (`gemini-2.5-flash` / `gemini-2.0-flash`) | Sinh bộ 5 câu hỏi phỏng vấn và đánh giá câu trả lời qua HTTPS REST API (chỉ Backend gọi trực tiếp). |

---

## 3. Cấu trúc thư mục dự án

```text
AI_Mock_Interview/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py        # Đọc biến môi trường từ backend/.env
│   │   │   └── security.py      # Băm mật khẩu bcrypt & xác thực JWT Bearer
│   │   ├── db/
│   │   │   └── session.py       # Khởi tạo SQLAlchemy engine & SessionLocal
│   │   ├── models/
│   │   │   ├── auth.py          # Model bảng users
│   │   │   └── interview.py     # Model các bảng job_positions, interview_levels,
│   │   │                        # interview_sessions, interview_questions, interview_answers
│   │   ├── schemas/
│   │   │   ├── auth.py          # Pydantic schemas đăng ký / đăng nhập
│   │   │   └── interview.py     # Pydantic schemas phiên, câu hỏi & câu trả lời
│   │   ├── services/
│   │   │   ├── auth.py          # Nghiệp vụ tài khoản & cấp phát JWT
│   │   │   ├── gemini.py        # Tích hợp Google Gemini API & cơ chế fallback
│   │   │   └── interview.py     # Nghiệp vụ tạo phiên, lưu câu hỏi & lưu câu trả lời
│   │   ├── routers/
│   │   │   ├── auth.py          # Router /api/auth/*
│   │   │   └── interview.py     # Router /api/interviews/*
│   │   └── main.py              # Entry point FastAPI, CORS, tự động tạo bảng & seed dữ liệu
│   ├── .env.example             # Mẫu cấu hình biến môi trường
│   ├── .env                     # File cấu hình máy cục bộ (không commit lên Git)
│   └── requirements.txt         # Danh sách thư viện Python
├── frontend/
│   ├── css/
│   │   ├── base.css             # Biến màu & thiết lập CSS nền tảng
│   │   ├── layout.css           # Bố cục Sidebar, Topbar và vùng nội dung
│   │   ├── auth.css             # Giao diện đăng ký / đăng nhập
│   │   ├── positions.css        # Giao diện chọn vị trí & cấp độ
│   │   └── interview.css        # Giao diện phòng phỏng vấn, loading & báo lỗi
│   ├── js/
│   │   ├── api.js               # Hàm fetch dùng chung (gắn JWT, timeout, bắt lỗi)
│   │   ├── layout.js            # Xử lý bố cục & điều hướng chung
│   │   ├── auth.js              # Kết nối API đăng ký / đăng nhập
│   │   ├── positions.js         # Chọn vị trí & cấp độ, khởi tạo phiên mới
│   │   └── interview.js         # Tải 5 câu hỏi, lưu nháp & gửi câu trả lời
│   ├── index.html               # Trang Đăng nhập / Đăng ký
│   ├── positions.html           # Trang chọn Vị trí & Cấp độ
│   └── interview.html           # Trang Phòng phỏng vấn AI
├── .gitignore
└── README.md
```

---

## 4. Hướng dẫn cài đặt và chạy dự án

### Yêu cầu môi trường
- **Python 3.10+** (khuyến nghị Python 3.11 hoặc 3.12).
- **MySQL 8.0+** (hoặc XAMPP / Laragon / MariaDB tương đương).
- **Google Gemini API Key** (lấy miễn phí tại Google AI Studio; nếu chưa có, hệ thống tự động dùng bộ 5 câu hỏi dự phòng để kiểm thử).

### Bước 1: Tạo cơ sở dữ liệu MySQL
Mở MySQL Workbench / phpMyAdmin / MySQL CLI và chạy lệnh sau:

```sql
CREATE DATABASE IF NOT EXISTS ai_mock_interview
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

*(Không cần tự tạo bảng thủ công: khi Backend khởi chạy, SQLAlchemy sẽ tự động tạo các bảng và nạp sẵn 4 vị trí cùng 3 cấp độ mẫu).*

### Bước 2: Cài đặt và khởi chạy Backend (FastAPI)
Mở PowerShell tại thư mục gốc dự án:

```powershell
cd backend

# 1. Tạo và kích hoạt môi trường ảo
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

# 2. Cài đặt thư viện
python -m pip install -r requirements.txt

# 3. Tạo file cấu hình .env từ file mẫu
Copy-Item .env.example .env
```

Mở file `backend/.env` và cập nhật thông tin thực tế của máy bạn:

```env
DATABASE_URL=mysql+pymysql://root:mat_khau_mysql_cua_ban@127.0.0.1:3306/ai_mock_interview?charset=utf8mb4
SECRET_KEY=ptit-ai-mock-interview-secret-key-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=your_gemini_api_key_here
```

*(Lưu ý: Nếu MySQL trên XAMPP/Laragon không có mật khẩu, xóa phần `:mat_khau_mysql_cua_ban` trong `DATABASE_URL`).*

Khởi động server Backend:

```powershell
python -m uvicorn app.main:app --reload
```

- Server chạy tại: `http://127.0.0.1:8000`
- Tài liệu Swagger UI: `http://127.0.0.1:8000/docs`
- Kiểm tra kết nối DB: `http://127.0.0.1:8000/health/db`

### Bước 3: Khởi chạy Frontend
Mở một cửa sổ PowerShell mới tại thư mục `frontend` và chạy server tĩnh (hoặc dùng extension **Live Server** trong VS Code):

```powershell
cd frontend
python -m http.server 5500
```

Truy cập trình duyệt tại `http://127.0.0.1:5500/index.html` để trải nghiệm trọn bộ luồng:
1. Đăng ký tài khoản mới và đăng nhập.
2. Chọn 1 vị trí (`Frontend`, `Backend`, `Tester`, `BA`) và 1 cấp độ (`Intern`, `Fresher`, `Junior`).
3. Vào phòng phỏng vấn, nhận 5 câu hỏi từ AI và gửi lần lượt từng câu trả lời.

---

## 5. Danh sách RESTful API hiện có

| Phương thức | Endpoint | Xác thực | Mô tả |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | Không | Kiểm tra trạng thái hoạt động của FastAPI. |
| `GET` | `/health/db` | Không | Kiểm tra kết nối tới cơ sở dữ liệu MySQL (`SELECT 1`). |
| `POST` | `/api/auth/register` | Không | Đăng ký tài khoản mới, hash mật khẩu và trả về JWT token. |
| `POST` | `/api/auth/login` | Không | Đăng nhập bằng email & mật khẩu, trả về JWT token. |
| `POST` | `/api/interviews` | JWT Bearer | Khởi tạo phiên phỏng vấn mới và tự động gọi AI sinh 5 câu hỏi. |
| `POST` | `/api/interviews/{session_id}/questions/generate` | JWT Bearer | Sinh và lưu 5 câu hỏi cho phiên chưa có đủ câu hỏi. |
| `GET` | `/api/interviews/{session_id}` | JWT Bearer | Lấy chi tiết phiên phỏng vấn, danh sách 5 câu hỏi và trạng thái đã trả lời. |
| `POST` | `/api/interviews/{session_id}/answers` | JWT Bearer | Lưu câu trả lời cho từng câu hỏi (chống gửi trùng `409 Conflict`, tự chuyển `COMPLETED` khi đủ 5/5 câu). |

---

## 6. Thiết kế cơ sở dữ liệu (8 bảng ERD)

1. `users` – Thông tin tài khoản người dùng và mật khẩu đã băm (`password_hash`).
2. `job_positions` – Danh mục 4 vị trí (`Frontend`, `Backend`, `Tester`, `BA`).
3. `interview_levels` – Danh mục 3 cấp độ (`Intern`, `Fresher`, `Junior`).
4. `interview_sessions` – Thông tin phiên phỏng vấn và trạng thái vòng đời.
5. `interview_questions` – Danh sách 5 câu hỏi do AI sinh theo thứ tự `1..5`.
6. `interview_answers` – Nội dung câu trả lời văn bản của ứng viên (ràng buộc duy nhất theo `question_id`).
7. `interview_evaluations` – Điểm số ($0\text{--}10$), nhận xét, ưu/nhược điểm từng câu do AI đánh giá *(Sprint 3)*.
8. `interview_reports` – Điểm trung bình và báo cáo tổng kết toàn phiên *(Sprint 3)*.

---

## 7. Quy ước Git của nhóm

- **Tên nhánh:** `feature/<mã-task>-ten-ngan` (ví dụ: `feature/t05d195-gemini-questions`).
- **Thông điệp Commit:** `<Mã task>: <mô tả ngắn gọn>` (ví dụ: `T05D195: tich hop Gemini API sinh 5 cau hoi va luu vao mysql`).
- **Bảo mật:** Tuyệt đối **không commit** file `backend/.env`, thư mục `.venv/` và `__pycache__/` lên GitHub.