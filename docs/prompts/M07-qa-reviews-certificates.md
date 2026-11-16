# M07 — Hỏi đáp, đánh giá, chứng chỉ

**Phụ thuộc:** M06. **UC:** S12, S13, S14, S17, S18, S19, S20.

**Đọc trước:** rules 40 phần "Q&A, reviews, certificates", api-contract §5 (kể cả G-01), rules 20 phần "Downloads".

**Việc cần làm**
1. Hỏi đáp trong khóa: danh sách, chi tiết chủ đề, đặt câu hỏi (tiêu đề ≤200, nội dung ≤5000, chọn bài tùy chọn),
   trả lời tiếp với tư cách người hỏi, sửa/xóa của mình, đánh dấu/bỏ đánh dấu đã giải quyết. Nội dung bị admin ẩn → chỉ đọc.
2. Đánh giá: form 1–5 sao + nhận xét ≤2000, gửi bằng `POST /courses/{id}/reviews` (tạo mới hoặc cập nhật).
   Về G-01 (không có endpoint đọc đánh giá của chính mình): nếu cần điền sẵn form hay gỡ đánh giá mà không có id → DỪNG và báo.
3. Chứng chỉ: danh sách; tải PDF có Bearer rồi chia sẻ; sao chép link xác minh `webLinks.certificate(code)`.

**Xong khi:** test cho validate độ dài, thông báo `QA_QUESTION_DUPLICATE`, luồng tải PDF (mock FileSystem);
lệnh kiểm tra xanh; ghi G-01 vào progress nếu đã gặp.
