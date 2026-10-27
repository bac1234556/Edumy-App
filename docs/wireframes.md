# Tài liệu Đặc tả Wireframe Giao diện Edumy Mobile App

> **Mã công việc:** W7-T1  
> **Áp dụng cho:** Toàn bộ 5 module (Member A, B, C, D, E)  
> **Design System:** React Native Paper (Material Design 3)  
> **Ảnh tổng quan Wireframe:** [`wireframes-overview.png`](file:///C:/Users/bacle/.gemini/antigravity-ide/scratch/Edumy-App/docs/wireframes-overview.png)

---

## 1. Tiêu chuẩn Giao diện Chung (Design Guidelines)
- **Màu sắc chủ đạo:**
  - Primary: Deep Blue (`#2563EB`)
  - Secondary / Accent: Emerald Green (`#10B981`)
  - Warning / Pending: Amber (`#F59E0B`)
  - Danger / Rejected: Rose Red (`#EF4444`)
  - Background: Light (`#F8FAFC`) / Dark Surface (`#1E293B`)
- **Typography:** Roboto / Inter, phân cấp rõ `TitleLarge`, `HeadlineSmall`, `BodyMedium`, `LabelSmall`.
- **Yêu cầu 3 trạng thái bắt buộc cho mọi màn hình (DoD):**
  1. **Loading State:** Skeleton Loading (khung xám nhấp nháy) hoặc ActivityIndicator ở giữa.
  2. **Empty State:** Hình minh họa vector nhẹ, dòng thông báo thân thiện và nút hành động Call-to-Action (ví dụ: "Chưa có khóa học nào - Khám phá ngay").
  3. **Error State:** Banner cảnh báo màu đỏ/cam, thông điệp lỗi rõ ràng và nút "Thử lại" (Retry).

---

## 2. Phân hệ Member A: Xác thực & Thông tin cá nhân (Auth & Profile)

### Màn hình A1: Đăng nhập (Login Screen)
- **Cấu trúc UI:**
  - Header: Logo Edumy, khẩu hiệu "Học mọi lúc, vững tương lai".
  - Body:
    - Text Input (Email) có icon hòm thư.
    - Text Input (Mật khẩu) có icon con mắt ẩn/hiện mật khẩu.
    - Text link "Quên mật khẩu?".
    - Nút `Đăng nhập` (Elevated Button, full-width).
    - Quick Switch Role Demo (dành cho bảo vệ đồ án: 3 nút bấm nhanh điền sẵn credentials của Student, Instructor, Admin).
  - Footer: Dòng chữ "Chưa có tài khoản? Đăng ký ngay".
- **Hành vi & Phản hồi:**
  - Validate email hợp lệ và mật khẩu tối thiểu 6 ký tự trước khi gọi API.
  - Khi API trả về JWT $\rightarrow$ Lưu `accessToken`, `refreshToken` và `userProfile` vào Zustand + SecureStore.
  - Tự động điều hướng đến Bottom Tabs tương ứng theo `role`.

### Màn hình A2: Đăng ký (Register Screen)
- **Cấu trúc UI:**
  - Text Input: Họ và tên, Email, Mật khẩu, Nhập lại mật khẩu.
  - Segmented Buttons chọn vai trò: `Học viên (Student)` hoặc `Giảng viên (Instructor)`.
  - Checkbox xác nhận điều khoản dịch vụ.
  - Nút `Tạo tài khoản`.

### Màn hình A3: Thông tin cá nhân & Đổi mật khẩu (Profile & Settings)
- **Cấu trúc UI:**
  - Avatar người dùng (kèm icon camera để đổi ảnh đại diện, upload lên Cloudinary).
  - Tên hiển thị, email và badge vai trò (`STUDENT`, `INSTRUCTOR`, `ADMIN`).
  - Danh mục menu:
    - Chỉnh sửa hồ sơ (Họ tên, Bio giới thiệu).
    - Đổi mật khẩu (Mật khẩu cũ, mật khẩu mới).
    - Cài đặt thông báo.
    - Nút `Đăng xuất` (Màu đỏ, xác nhận qua AlertDialog).

---

## 3. Phân hệ Member B: Khám phá & Danh mục khóa học (Catalog & Discovery)

### Màn hình B1: Trang chủ (Home Screen)
- **Cấu trúc UI:**
  - Header: Lời chào cá nhân hóa "Chào [Tên]", icon chuông thông báo (kèm chấm đỏ số lượng chưa đọc).
  - Search Bar: Bấm vào chuyển sang Màn hình B2.
  - Hero Banner: Carousel quảng bá các khóa học thịnh hành / ưu đãi.
  - Horizontal Chips: Danh mục khóa học (`Tất cả`, `Lập trình`, `Thiết kế`, `Kinh doanh`...).
  - Section "Khóa học nổi bật": Danh sách thẻ khóa học (Card) cuộn ngang.
  - Section "Mới xuất bản": Danh sách thẻ dọc có phân trang (Infinite scroll).
- **Thành phần Course Card:**
  - Ảnh Thumbnail tỷ lệ 16:9.
  - Tiêu đề khóa học (tối đa 2 dòng).
  - Tên giảng viên & Avatar nhỏ.
  - Đánh giá: Sao vàng (⭐ 4.8) và số lượt đánh giá trong ngoặc `(120)`.
  - Giá tiền: Màu xanh lục đậm nổi bật (hoặc nhãn `Miễn phí`).
  - Icon trái tim Wishlist ở góc ảnh (bấm để thêm/xóa nhanh).

### Màn hình B2: Tìm kiếm & Bộ lọc (Search & Filter)
- **Cấu trúc UI:**
  - Search Input có nút 'X' xóa nhanh từ khóa (áp dụng `debounce 400ms`).
  - Filter Modal (hoặc Bottom Sheet):
    - Lọc theo Cấp độ: `Tất cả`, `Cơ bản`, `Trung cấp`, `Nâng cao`.
    - Lọc theo Giá: `Tất cả`, `Miễn phí (0đ)`, `Có phí`.
    - Sắp xếp theo: `Mới nhất`, `Đánh giá cao nhất`, `Giá tăng dần`, `Giá giảm dần`.
  - Danh sách kết quả: Dạng lưới 2 cột hoặc danh sách dọc.

### Màn hình B3: Chi tiết khóa học (Course Detail)
- **Cấu trúc UI:**
  - Video Player thu nhỏ ở đầu trang phát thử bài Preview miễn phí.
  - Tiêu đề khóa học, Subtitle tóm tắt, ngày cập nhật gần nhất.
  - Khung thông tin giảng viên (Avatar, Tên, Bio tóm tắt).
  - Accordion "Giáo trình khóa học" (Curriculum): Liệt kê từng Chương (Section) và từng Bài học (Lesson kèm icon khóa 🔒 hoặc mở bài xem trước).
  - Section "Đánh giá từ học viên": Điểm trung bình tổng quan, thanh phân bổ 5 sao và danh sách bình luận gần nhất.
  - Bottom Sticky Bar: Hiển thị giá tiền và nút `Đăng ký ngay` (hoặc `Vào học ngay` nếu đã ghi danh).

### Màn hình B4: Khóa học yêu thích (Wishlist)
- **Cấu trúc UI:** Danh sách các khóa học đã thả tim, hỗ trợ vuốt sang trái (Swipe-to-delete) để xóa khỏi danh sách.

---

## 4. Phân hệ Member C: Giảng viên & Quản lý bài giảng (Instructor Studio)

### Màn hình C1: Khóa học của tôi (My Courses)
- **Cấu trúc UI:**
  - Top Tabs lọc trạng thái: `Tất cả`, `Bản nháp (Draft)`, `Chờ duyệt (Pending)`, `Đã duyệt (Published)`, `Từ chối (Rejected)`.
  - Thẻ khóa học hiển thị Badge trạng thái tương ứng:
    - `PUBLISHED`: Màu xanh lá cây.
    - `PENDING`: Màu vàng hổ phách (kèm thông báo "Đang chờ Admin kiểm duyệt").
    - `REJECTED`: Màu đỏ (bấm vào xem lý do từ chối chi tiết từ Admin).
    - `DRAFT`: Màu xám.
  - Floating Action Button (FAB `+`): Bấm để tạo khóa học mới.

### Màn hình C2: Tạo & Chỉnh sửa thông tin cơ bản (Course Form)
- **Cấu trúc UI:**
  - Ô nhập Tiêu đề khóa học, Phụ đề, Mô tả chi tiết (Rich text / Markdown).
  - Dropdown chọn Danh mục (Category).
  - Dropdown chọn Cấp độ (Level).
  - Ô nhập Giá bán (VNĐ).
  - Khu vực Upload Thumbnail: Bấm chọn ảnh từ thư viện thiết bị, hiển thị xem trước ảnh và thanh tiến trình upload lên Cloudinary.

### Màn hình C3: Trình dựng giáo trình & Tải video (Curriculum Builder)
- **Cấu trúc UI:**
  - Danh sách cây Section $\rightarrow$ Lesson.
  - Nút `+ Thêm chương mới`.
  - Dưới mỗi chương có nút `+ Thêm bài học`:
    - Nhập tiêu đề bài học.
    - Switch toggle: `Cho phép xem thử miễn phí (Preview)`.
    - Nút chọn video từ điện thoại.
    - **Thanh tiến trình Upload Video (0% - 100%):** Hiển thị rõ số byte/giây và cờ trạng thái xử lý trên Cloudinary.
  - Bottom Bar: Nút `Lưu bản nháp` và nút `Gửi phê duyệt` (Submit for Review).

---

## 5. Phân hệ Member D: Đơn hàng, Trình phát & Chứng chỉ (Learning & Orders)

### Màn hình D1: Thanh toán đơn hàng (Checkout)
- **Cấu trúc UI:**
  - Tóm tắt đơn hàng: Mã đơn `#EDM-xxxxx`, tên khóa học, giảng viên.
  - Chi tiết chi phí: Giá gốc, Giảm giá (0đ), Tổng thanh toán cuối cùng.
  - Tùy chọn phương thức thanh toán:
    - Radio 1: `Mock Checkout` (Mặc định trong môi trường demo kiểm thử).
    - Radio 2: `VNPay Sandbox` (Khi tích hợp ở Tuần 10).
  - Nút `Xác nhận thanh toán`:
    - Khi thành công $\rightarrow$ Hiển thị Modal chúc mừng và nút chuyển thẳng sang "Vào học ngay".

### Màn hình D2: Khóa học của tôi (My Learning)
- **Cấu trúc UI:**
  - Top Tabs: `Đang học` / `Đã hoàn thành`.
  - Thẻ khóa học hiển thị thanh ProgressBar tiến độ học tập (ví dụ: `75% hoàn thành - 12/16 bài`).
  - Nếu đạt 100% $\rightarrow$ Hiển thị nút bấm `Xem chứng chỉ` (Certificate).

### Màn hình D3: Trình phát bài học (Video Course Player)
- **Cấu trúc UI:**
  - Nửa trên màn hình: Viewport Video toàn màn hình/tỷ lệ 16:9 phát bằng `expo-video` với đầy đủ điều khiển (Play, Pause, Tua 10s, Thanh thời gian, Tốc độ 1x/1.5x/2x).
  - Tự động phát hiện khi xem $\ge 90\%$ thời lượng để gọi API cập nhật `is_completed = true`.
  - Nửa dưới màn hình có 3 Tab:
    1. **Tab Giáo trình (Lessons):** Danh sách toàn bộ bài học, đánh dấu tick xanh những bài đã xong, highlight bài đang phát.
    2. **Tab Tổng quan (Overview):** Mô tả bài giảng, tài liệu đính kèm.
    3. **Tab Thảo luận (Q&A):** Xem và đặt câu hỏi cho bài học này.

### Màn hình D4: Chứng chỉ hoàn thành (Certificate Screen)
- **Cấu trúc UI:**
  - Khung xem trước Chứng chỉ PDF trang trọng (khung viền vàng, logo Edumy, tên học viên, tên khóa học, chữ ký số).
  - Mã chứng chỉ tra cứu duy nhất: `EDUMY-2026-XXXX`.
  - Mã QR tra cứu chứng chỉ online.
  - Nút `Tải file PDF về máy` và nút `Chia sẻ chứng nhận`.

---

## 6. Phân hệ Member E: Quản trị & Hỏi đáp cộng đồng (Admin & Community)

### Màn hình E1: Bảng điều khiển Quản trị (Admin Dashboard)
- **Cấu trúc UI:**
  - 4 Thẻ KPI tóm tắt:
    1. Tổng số Người dùng (Học viên & Giảng viên).
    2. Tổng số Khóa học đang hoạt động.
    3. Tổng doanh thu hệ thống (VNĐ).
    4. Số khóa học đang chờ duyệt (Highlight viền đỏ nếu $> 0$).
  - Lối tắt tác vụ: `Hàng chờ duyệt khóa`, `Quản lý người dùng`, `Quản lý danh mục`.

### Màn hình E2: Hàng chờ duyệt khóa học (Course Review Queue)
- **Cấu trúc UI:**
  - Danh sách các khóa học trạng thái `PENDING`.
  - Màn hình thẩm định chi tiết:
    - Xem toàn bộ thông tin cơ bản, thumbnail, giá tiền.
    - Xem được danh sách video bài giảng của giảng viên để kiểm tra chất lượng.
  - Khu vực quyết định:
    - Nút `Phê duyệt (Approve)` $\rightarrow$ Chuyển khóa sang `PUBLISHED`.
    - Ô nhập `Lý do từ chối` và Nút `Từ chối (Reject)` $\rightarrow$ Chuyển khóa sang `REJECTED`, tự sinh Notification gửi giảng viên.

### Màn hình E3: Quản lý người dùng (User Management)
- **Cấu trúc UI:**
  - Search bar tìm kiếm theo Email hoặc Họ tên.
  - Bộ lọc Role: `Tất cả`, `Student`, `Instructor`.
  - Danh sách người dùng dạng bảng/thẻ kèm avatar.
  - Action Switch: `Khóa tài khoản (Lock)` / `Mở khóa (Unlock)` kèm hộp thoại cảnh báo xác nhận.

### Màn hình E4: Quản lý danh mục (Category Management)
- **Cấu trúc UI:**
  - Danh sách danh mục đa cấp (tên, slug, icon).
  - Nút thêm mới danh mục (Mở Dialog nhập Tên, Icon, chọn danh mục cha nếu có).
  - Nút Sửa / Xóa danh mục.

### Màn hình E5: Hỏi đáp bài giảng & Thông báo (Q&A & Notifications)
- **Cấu trúc UI:**
  - Danh sách câu hỏi theo bài học, sắp xếp theo thời gian mới nhất.
  - Ô nhập câu hỏi mới kèm nút `Đăng câu hỏi`.
  - Luồng trả lời dưới từng câu hỏi:
    - Hiển thị phản hồi của học viên khác hoặc giảng viên.
    - Giảng viên có nút `Đánh dấu câu trả lời đúng / hữu ích` (Hiển thị icon check xanh đặc biệt).
  - Màn hình Thông báo: Danh sách thông báo đẩy theo thời gian thực (đánh dấu đã đọc/chưa đọc).
