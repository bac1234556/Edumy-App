# M04 — Khám phá khóa học và trang khóa học

**Phụ thuộc:** M03. **UC:** G01, G02, G03, G04, G11. **Quy tắc:** D-M02, BR-31.

**Đọc trước:** rules 40 phần "Course page action", api-contract §2, đặc tả mục 4.1.

**Việc cần làm**
1. `features/catalog`: danh sách có tìm kiếm (debounce), lọc danh mục, miễn phí/trả phí, 4 kiểu sắp xếp,
   cuộn vô hạn 20 mục/trang; khi tìm không ra thì hiện `suggestions` với tiêu đề "Có thể bạn quan tâm".
2. Trang khóa `courses/[slug]`: ảnh, mô tả, giảng viên, điểm, đề cương (bài xem trước có nhãn và mở được),
   danh sách đánh giá ở `courses/[slug]/reviews`.
3. Hàm thuần `resolveCourseAction` đúng **6 dòng** của bảng D-M02 và component nút hành động dùng nó.
   - "Ghi danh miễn phí" gọi `POST /courses/{id}/enrollments` (201 hoặc 200 → mở trang học).
   - "Thêm vào giỏ" gọi `POST /cart/items`; xử lý các mã lỗi giỏ hàng theo rules 20.
   - "Mua trên website" mở `webLinks.course(slug)` bằng trình duyệt hệ thống (UC-M01).
4. Xem trước bài `courses/[slug]/preview/[lessonId]`: dùng chung component hiển thị bài với M06 (video / bài viết).

**Không được:** bất kỳ nút hay chữ "Thanh toán" nào; tự tính `isFree` hay điểm trung bình.

**Xong khi:** test cho mọi dòng của `resolveCourseAction`; sau khi thêm vào giỏ, trang khóa chuyển sang
"Đã có trong giỏ" (invalidate `courseDetail`); lệnh kiểm tra xanh.
