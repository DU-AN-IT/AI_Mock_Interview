# AI Mock Interview - Hướng dẫn chạy nhanh

## A. Chuẩn bị MySQL

1. Mở XAMPP và bật MySQL (dự án đang dùng cổng `3307`).
2. Mở phpMyAdmin, chọn tab SQL và chạy:

```sql
CREATE DATABASE IF NOT EXISTS ai_mock_interview_gemini
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## B. Cấu hình và chạy Backend

1. Mở thư mục `backend` trong dự án.
2. Chạy `setup_backend.bat` một lần để tạo môi trường Python và cài thư viện.
3. Mở `backend/.env` bằng VS Code.
4. Kiểm tra `DATABASE_URL` đúng với MySQL của bạn và điền Gemini API key vào `GEMINI_API_KEY`.
5. Chạy `run_backend.bat`.
6. Mở `http://127.0.0.1:8000/docs` để xem API.
7. Kiểm tra `http://127.0.0.1:8000/health/db` phải trả về trạng thái database connected.

Cấu hình `.env` mẫu:

```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3307/ai_mock_interview_gemini?charset=utf8mb4
SECRET_KEY=thay_bang_chuoi_bi_mat_dai_va_ngau_nhien_it_nhat_32_ky_tu
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=dan_gemini_api_key_cua_ban_o_day
GEMINI_MODEL=gemini-2.5-flash
```

Không gửi hoặc commit file `.env` vì trong đó có API key và thông tin kết nối.

## C. Chạy Frontend

1. Mở thư mục `frontend` trong VS Code.
2. Nhấn chuột phải `index.html` và chọn **Open with Live Server**.
3. Mặc định Live Server thường chạy ở cổng `5500`.
4. Đăng ký tài khoản, đăng nhập, chọn vị trí/cấp độ rồi bắt đầu phỏng vấn.

Nếu Live Server chạy ở cổng khác `5500` hoặc `5501`, thêm địa chỉ origin đó vào `allow_origins` trong `backend/app/main.py`.

## D. Chức năng đã tích hợp

- Đăng ký và đăng nhập bằng JWT.
- Tạo phiên phỏng vấn theo vị trí và cấp độ.
- Gemini tạo đúng 5 câu hỏi và lưu vào MySQL.
- Gửi câu trả lời lên Backend, lưu hoặc cập nhật theo từng câu hỏi.
- Có trạng thái đang gửi và thông báo lỗi; nội dung câu trả lời vẫn còn trên giao diện khi gửi lỗi.
- Kiểm tra câu trả lời tối thiểu 1 ký tự sau khi loại bỏ khoảng trắng, tối đa 10.000 ký tự.
- Gửi trùng câu hỏi sẽ nhận HTTP `409 Conflict` thay vì ghi đè dữ liệu.
- Kết thúc phiên và cập nhật trạng thái `COMPLETED`.

## E. Các bảng database

Khi Backend khởi động thành công, SQLAlchemy tự tạo các bảng:

- `users`
- `job_positions`
- `interview_levels`
- `interview_sessions`
- `interview_questions`
- `interview_answers`

Các vị trí và cấp độ mẫu được tự động thêm nếu bảng tương ứng đang trống.
