# B02 — Tỷ lệ chia doanh thu của đồng giảng viên (authoring)

**Phụ thuộc:** B00. **Quy tắc:** BR-43, BR-44, BR-45, BR-46 (đặc tả mục 5.2).

**Việc cần làm**
1. Migration **V7** theo DDL đã duyệt ở B00: tỷ lệ (bps, 0–10.000) cho dòng `course_co_instructors`. GV chính không có cột;
   phần của họ được tính ra = 10.000 − tổng tỷ lệ các đồng GV `accepted`.
2. Lời mời (UC-I13) thêm trường bắt buộc `shareBps`. Dưới khóa dòng `courses` (đã có), kiểm: tổng `accepted` + `pending`
   + tỷ lệ mới ≤ 10.000, nếu không → 422 `CO_INSTRUCTOR_SHARE_EXCEEDS_TOTAL`. Mời lại (D-18) đặt tỷ lệ mới.
3. Endpoint GV chính: `PUT /instructor/courses/{id}/co-instructors/{userId}/share {shareBps}` cho người `accepted` hoặc `pending`,
   cùng kiểm tổng; được phép cả khi khóa `pending_review` (không phải nội dung, BR-33 không áp dụng).
   Phát event `CoInstructorShareChanged` → thư "Tỷ lệ chia đã thay đổi" (notification).
4. Thư mời đồng GV hiển thị tỷ lệ. Chi tiết khóa của giảng viên và danh sách lời mời trả `shareBps` và `mainShareBps`.
5. `authoring::api`: API đọc nhóm giảng viên của nhiều khóa trong một truy vấn → `mainInstructorId` + danh sách
   `{instructorId, shareBps}` chỉ gồm `accepted` (để `payout` chụp lại khi thanh toán).

**Test bắt buộc:** vượt 100% khi mời và khi đổi; `pending` giữ chỗ; gỡ/rời/từ chối trả phần về GV chính; người lạ 404,
đồng GV không đổi được tỷ lệ; thư được phát sau commit; `ModularityTest` xanh. Chạy `./mvnw test`.
