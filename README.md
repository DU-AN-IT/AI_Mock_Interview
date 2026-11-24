# 🎯 AI Mock Interview – Nền Tảng Phỏng Vấn Thử Với AI

Hệ thống giả lập phỏng vấn chuyên môn 1:1 ứng dụng **Google Gemini AI**. Tự động sinh câu hỏi thực tế theo vị trí và cấp độ, đánh giá câu trả lời đa tiêu chí theo chuẩn **Rubric** và cung cấp nhận xét chi tiết cùng câu trả lời mẫu từ chuyên gia tức thì.

---

## 🌟 1. Cấu trúc Giao diện & Các màn hình

Dự án Frontend được xây dựng bằng HTML5, CSS3 và JavaScript thuần (Vanilla JS), chia thành các trang chức năng rõ ràng:

| Tệp giao diện | Chức năng chính |
| :--- | :--- |
| **`index.html`** | **Trang giới thiệu (Landing Page)**: Navbar, Hero showcase, Live Mockup câu hỏi & đánh giá AI, Quy trình 3 bước, 6 Tính năng nổi bật, Chuẩn Rubric 4 tiêu chí và Kiến trúc công nghệ. |
| **`auth.html`** | **Xác thực tài khoản**: Đăng nhập & Đăng ký tài khoản ứng viên với xác thực JWT (JSON Web Token). |
| **`positions.html`** | **Thiết lập phỏng vấn**: Chọn vị trí ứng tuyển (*Frontend, Backend, Tester, BA...*) và cấp độ kỹ năng (*Intern, Fresher, Junior...*). |
| **`interview.html`** | **Phòng phỏng vấn trực tiếp**: Hiển thị bộ 5 câu hỏi sinh bởi Gemini AI, cho phép ứng viên nhập câu trả lời, gửi chấm điểm tức thì và xem nhận xét. |
| **`results.html`** | **Báo cáo kết quả**: Tổng kết điểm số, phân tích biểu đồ Radar 4 tiêu chí, điểm mạnh, điểm cần cải thiện và gợi ý câu trả lời mẫu chuẩn. |
| **`history.html`** | **Lịch sử phỏng vấn**: Tra cứu, tìm kiếm và lọc các phiên phỏng vấn đã thực hiện của ứng viên. |

---

## ⚙️ 2. Chuẩn bị Cơ sở Dữ liệu (MySQL / XAMPP)

1. Mở **XAMPP Control Panel** và bật dịch vụ **MySQL** (mặc định cổng `3306` hoặc `3307`).
2. Mở trình quản lý phpMyAdmin (`http://localhost/phpmyadmin`), chọn tab **SQL** và chạy lệnh tạo database:

```sql
CREATE DATABASE IF NOT EXISTS ai_mock_interview
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

*(Lưu ý: Nếu bạn sử dụng tên database khác như `ai_mock_interview_gemini`, hãy điều chỉnh lại trong file `backend/.env` tương ứng).*

---

## 🚀 3. Cấu hình và Chạy Backend (FastAPI)

### Bước 1: Thiết lập môi trường Python
Mở terminal/PowerShell tại thư mục `backend`:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```
*(Hoặc có thể chạy nhanh file `setup_backend.bat` một lần).*

### Bước 2: Cấu hình biến môi trường (`.env`)
Sao chép `.env.example` thành `.env` (hoặc mở file `backend/.env`) và cấu hình:

```env
DATABASE_URL=mysql+pymysql://root:123456@127.0.0.1:3306/ai_mock_interview?charset=utf8mb4
SECRET_KEY=ptit-ai-mock-interview-secret-key-2026-super-secure
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.5-flash-lite
```

> **Ghi chú cấu hình:**
> - Nếu MySQL không có mật khẩu: `mysql+pymysql://root:@127.0.0.1:3306/ai_mock_interview?charset=utf8mb4`
> - Nếu MySQL dùng cổng 3307: Đổi `3306` thành `3307`.
> - **Cơ chế dự phòng mô hình AI (Model Fallback):** Hệ thống ưu tiên `gemini-3.5-flash-lite`, nếu gặp lỗi quá tải (HTTP 503) sẽ tự động fallback lần lượt sang `gemini-3.8-flash`, `gemini-3.5-flash` và `gemini-2.5-flash`.

### Bước 3: Khởi động máy chủ FastAPI
Chạy file `run_backend.bat` hoặc lệnh:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

* **Tài liệu Swagger API:** `http://127.0.0.1:8000/docs`
* **Kiểm tra trạng thái hệ thống:** `http://127.0.0.1:8000/health`
* **Kiểm tra kết nối Database:** `http://127.0.0.1:8000/health/db`

---

## 💻 4. Chạy Giao diện Frontend

1. Mở thư mục `frontend` bằng VS Code.
2. Nhấn chuột phải vào **`index.html`** và chọn **Open with Live Server** (phím tắt `Alt+L Alt+O`).
3. Mặc định Live Server sẽ mở tại `http://127.0.0.1:5500`.
4. Người dùng xem phần giới thiệu hệ thống, sau đó bấm **"Bắt đầu ngay"** để chuyển sang trang đăng nhập/đăng ký tài khoản (`auth.html`).

---

## 📊 5. Tiêu Chuẩn Chấm Điểm Rubric (Thang điểm 0 - 10)

Mỗi câu trả lời của ứng viên được Gemini AI phân tích độc lập theo 4 tiêu chí cốt lõi:

1. **Độ chính xác (Accuracy - 0 đến 2.5 điểm):** Tính đúng đắn của khái niệm kỹ thuật, thuật toán và nguyên lý nền tảng.
2. **Độ đầy đủ (Completeness - 0 đến 2.5 điểm):** Trả lời đúng trọng tâm câu hỏi, không bỏ sót các ý cốt lõi.
3. **Tính mạch lạc & Cấu trúc (Clarity - 0 đến 2.5 điểm):** Trình bày logic, phân đoạn rõ ràng, sử dụng chuẩn thuật ngữ chuyên ngành.
4. **Lập luận & Thực tế (Examples - 0 đến 2.5 điểm):** Đưa ra dẫn chứng thực tế, phân tích đánh đổi (trade-offs) và kinh nghiệm xử lý bài toán.

---

## 🛠️ 6. Danh Sách API Chính

| Nhóm | Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/health` | Kiểm tra tình trạng server |
| **Health** | `GET` | `/health/db` | Kiểm tra kết nối MySQL |
| **Auth** | `POST` | `/api/auth/register` | Đăng ký tài khoản ứng viên |
| **Auth** | `POST` | `/api/auth/login` | Đăng nhập và nhận JWT token |
| **Interview** | `POST` | `/api/interviews` | Khởi tạo phiên phỏng vấn mới |
| **Interview** | `POST` | `/api/interviews/{id}/questions/generate` | Gemini AI sinh 5 câu hỏi phỏng vấn |
| **Interview** | `GET` | `/api/interviews/{id}` | Lấy chi tiết phiên phỏng vấn và các câu hỏi |
| **Interview** | `POST` | `/api/interviews/{id}/answers` | Nộp câu trả lời & AI chấm điểm Rubric tức thì |
| **Results** | `GET` | `/api/interviews/{id}/result` | Báo cáo chi tiết phiên, biểu đồ Radar và feedback |
| **History** | `GET` | `/api/interviews/history` | Lấy lịch sử các phiên phỏng vấn của ứng viên |

---

## 🔒 7. Bảo mật & Lưu ý

* File `.env` chứa mật khẩu Database và Gemini API Key. **Tuyệt đối không commit hoặc chia sẻ file `.env` lên các kho mã nguồn công khai (GitHub/GitLab).**
* Khi câu hỏi đã được trả lời, gửi trùng sẽ nhận HTTP `409 Conflict` để bảo toàn dữ liệu đánh giá ban đầu.
