# Backend: FastAPI + MySQL

Phạm vi hiện tại chỉ gồm cấu hình kết nối MySQL và endpoint kiểm tra API/database.

## Yêu cầu

- Python 3.10 trở lên
- MySQL

## Cài đặt trên Windows

Mở PowerShell tại thư mục `backend`:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Tạo database một lần trong MySQL:

```sql
CREATE DATABASE ai_mock_interview
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Sửa `DATABASE_URL` trong `.env` theo thông tin MySQL của bạn. Không commit `.env` hoặc mật khẩu thật. Nếu mật khẩu có ký tự đặc biệt, URL-encode mật khẩu.

## Chạy và kiểm tra

Trong thư mục `backend`:

```powershell
uvicorn app.main:app --reload
```

Mở PowerShell khác để kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/health/db
```

- `GET /health`: xác nhận FastAPI đang chạy.
- `GET /health/db`: chạy `SELECT 1` trên MySQL; trả HTTP 503 nếu chưa cấu hình hoặc kết nối lỗi.
- `GET /docs`: tài liệu API.

Phần này kiểm tra kết nối, chưa tạo các bảng nghiệp vụ.
