# M06 — Học tập

**Phụ thuộc:** M04. **UC:** S08, S09, S10, S11, S15. **Quy tắc:** D-32, D-33, D-34, BR-31. **AC:** AC-M01, AC-M02, AC-M08.

**Đọc trước:** rules 40 phần "Learning", api-contract §4, đặc tả 4.4.

**Việc cần làm**
1. Tab Học tập: `GET /me/enrollments` (gồm cả khóa bị ẩn), % tiến độ, nút "Học tiếp" mở `lastAccessedLessonId`
   (không có thì bài đầu tiên), huy hiệu chứng chỉ.
2. `learn/[courseId]`: đề cương theo chương, dấu đã hoàn thành, thanh tiến độ từ `progress` của server.
   Giảng viên của khóa (`progress = null`) xem ở chế độ chỉ đọc.
3. `learn/lesson/[lessonId]`: gọi `visit` một lần mỗi lần mở; video `.mp4`/`.m3u8` → expo-video, đường dẫn khác →
   WebView; bài viết hiển thị văn bản thuần; nút bật/tắt "Đánh dấu hoàn thành" (`PUT …/completion`).
4. `certificateIssued: true` → hộp chúc mừng và nút "Xem chứng chỉ".
5. 403 `ENROLLMENT_REQUIRED` → chuyển về trang khóa; 404 → "Không tìm thấy".

**Không được:** tự đánh dấu hoàn thành khi xem hết video; tự tính phần trăm; tải video về máy.

**Xong khi:** test cho hàm chọn trình phát theo URL và cho việc invalidate sau khi đánh dấu; thử thủ công AC-M02
(đánh dấu trên app → web thấy). Lệnh kiểm tra xanh.
