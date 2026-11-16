# Kịch Bản Trình Diễn Hệ Thống (Demo Script) — Edumy Ecosystem (Web + Mobile + Backend)

Tài liệu hướng dẫn các bước trình diễn thực tế liên thông giữa 3 phân hệ: **Edumy Web (SPA)**, **Edumy Mobile (Expo App)** và **Edumy Backend (Spring Boot Modulith)** trong buổi báo cáo / bảo vệ đồ án.

---

## 1. Chuẩn bị môi trường trước buổi Demo

1. **Cơ sở dữ liệu (SQL Server):**
   - Đảm bảo database `EduMyDb` đang hoạt động (Local hoặc Docker SQL Server port 1433).
2. **Khởi chạy Backend (Spring Boot):**
   ```bash
   cd c:\Users\bacle\Downloads\Edumy-main\Edumy\Edumy\Backend
   .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
   ```
   > **Lưu ý:** Backend lắng nghe trên cổng `5000` (`http://localhost:5000/api/v1`).
3. **Khởi chạy Frontend Web:**
   ```bash
   cd c:\Users\bacle\Downloads\Edumy-main\Edumy\Frontend
   npm run dev
   ```
   > Web chạy trên cổng `http://localhost:3000`.
4. **Khởi chạy Mobile App (Expo):**
   ```bash
   cd c:\Users\bacle\Downloads\Edumy-App
   npx expo start
   ```
   - Nhấn `a` để chạy trên Android Emulator (kết nối tới `http://10.0.2.2:5000/api/v1`).
   - Hoặc quét mã QR trên ứng dụng Expo Go trên thiết bị vật lý cùng mạng LAN (cập nhật `EXPO_PUBLIC_API_BASE_URL=http://<IP-LAN>:5000/api/v1`).

---

## 2. Các bước kịch bản trình diễn (Demo Flow)

### 🎬 Màn 1: Học viên Khám phá & Đồng bộ Giỏ hàng giữa Web và Mobile
1. **Trên Mobile App:**
   - Mở màn hình **Khám phá (Catalog)**. Sử dụng thanh tìm kiếm và bộ lọc danh mục.
   - Chọn một khóa học có phí và một khóa học miễn phí.
   - Bấm **Thêm vào giỏ hàng**.
   - Chuyển sang Tab **Giỏ hàng**: Thấy danh sách khóa học và tổng tiền tính bằng VNĐ.
2. **Giải thích quy tắc App Store / Google Play (BR-M01):**
   - Giới thiệu chính sách không thanh toán trực tiếp trong app để tránh phí sàn 30%.
   - Bấm nút **"Thanh toán trên Web"** -> App tự động mở trình duyệt dẫn đến `${WEB_BASE_URL}/cart`.

---

### 🎬 Màn 2: Thanh toán trên Web & Tự động kích hoạt vào Mobile
1. **Trên Web SPA:**
   - Đăng nhập cùng tài khoản học viên.
   - Thấy đúng giỏ hàng đã đồng bộ từ Mobile.
   - Tiến hành tạo đơn hàng và giả lập thanh toán VNPay thành công.
   - Backend tự động:
     - Ghi nhận `Order` trạng thái `PAID`.
     - Kích hoạt `Enrollment` cho học viên.
     - Hạch toán `EarningEntry` cho Giảng viên chính và Đồng giảng viên (theo tỷ lệ chia sẻ % đã cấu hình).
2. **Quay lại Mobile App:**
   - Mở Tab **Học tập (My Learning)**.
   - Nhờ cơ chế `useForegroundSync`, khóa học vừa thanh toán lập tức xuất hiện trong danh sách học tập với 0% tiến độ.

---

### 🎬 Màn 3: Trải nghiệm Phòng học, Q&A và Nhận Chứng chỉ trên Mobile
1. **Vào phòng học:**
   - Bấm nút **"Học tiếp"** trên thẻ khóa học để vào thẳng đề cương và bài học gần nhất.
   - Trình phát video (expo-video / HLS) phát nội dung bài giảng mượt mà.
   - Gửi câu hỏi thảo luận trong mục **Hỏi & Đáp (Q&A)** của bài học.
2. **Hoàn thành khóa học & Nhận chứng chỉ số:**
   - Bấm nút **"Hoàn thành bài học"** lần lượt cho các bài học.
   - Khi hoàn thành bài học cuối cùng đạt 100%: Modal chúc mừng cấp chứng chỉ xuất hiện ngay lập tức.
   - Bấm xem chứng chỉ:
     - Thấy thông tin chứng chỉ và mã chứng chỉ duy nhất.
     - Bấm **"Chia sẻ PDF"** -> App tải file PDF từ backend và mở hộp thoại hệ thống chia sẻ.
     - Bấm **"Sao chép liên kết"** để xác thực chứng chỉ công khai trên web.

---

### 🎬 Màn 4: Giảng viên theo dõi Doanh thu & Tạo yêu cầu Rút tiền
1. **Đăng nhập tài khoản Giảng viên trên Mobile:**
   - Tab **Giảng viên** tự động xuất hiện (D-M01, BR-53).
   - Xem tổng quan tài chính: Số dư khả dụng, chờ đáo hạn, đang rút, đã rút và tổng doanh thu.
   - Xem phân tích thu nhập theo khóa học (phân rõ vai trò GV chính hoặc Đồng GV) và thu nhập theo từng tháng.
2. **Kiểm tra bút toán chi tiết:**
   - Nhấn **"Chi tiết bút toán thu nhập"** -> Thấy rõ từng đơn hàng: Mã đơn, Giá chốt, % Phí sàn Edumy (30%), % Chia sẻ của mình, Số tiền thực nhận và Ngày đáo hạn.
3. **Cài đặt tài khoản ngân hàng nhận tiền:**
   - Vào **"Tài khoản nhận"**: Thấy số tài khoản được mã hóa bảo mật chỉ hiện 4 chữ số cuối.
   - Nhập mật khẩu tài khoản hiện tại để cập nhật ngân hàng (Vietcombank, STK, Chủ tài khoản).
4. **Tạo yêu cầu rút tiền:**
   - Bấm **"Yêu cầu rút tiền"**.
   - Thử nhập 50.000 đ -> App cảnh báo lỗi tối thiểu 100.000 đ.
   - Bấm chọn chip nhanh **1.000.000 đ** hoặc **"Tất cả"** -> Bấm gửi yêu cầu.
   - Yêu cầu chuyển sang trạng thái **"Đang chờ xử lý"** (requested).
   - Biểu diễn tính năng **"Hủy yêu cầu"** (số dư lập tức hoàn trả về khả dụng).

---

### 🎬 Màn 5: Quản trị viên duyệt chi trên Web & Hoàn tất chu trình
1. **Trên Web Admin Dashboard:**
   - Admin đăng nhập và truy cập trang quản lý rút tiền (`/admin/withdrawals`).
   - Thấy yêu cầu rút tiền vừa tạo từ mobile của giảng viên.
   - Bấm **"Xác nhận chuyển khoản"** và nhập mã giao dịch ngân hàng (Transfer Reference).
2. **Kiểm tra kết quả trên Mobile:**
   - Trên Mobile App, vào **Lịch sử rút tiền** -> Trạng thái đổi thành **"Đã chuyển khoản"** (màu xanh lá) kèm mã giao dịch ngân hàng thực tế.
   - Số tiền chuyển từ mục "Đang rút" sang "Đã rút về TK".

---

## 3. Tổng kết điểm nhấn kỹ thuật
- **Kiến trúc đồng nhất:** 1 Database SQL Server duy nhất, 1 Spring Boot Backend Modulith chia sẻ toàn bộ nghiệp vụ, 2 clients Web SPA và Mobile Expo hoạt động ăn khớp 100%.
- **Bảo mật chuẩn ngân hàng:** Access token chỉ giữ trên RAM, Refresh token lưu trong Expo SecureStore với cơ chế quay vòng (token rotation) và phát hiện tấn công tái sử dụng (reuse detection).
- **Trải nghiệm người dùng cao cấp (Anti-AI-Slop):** Font chữ đồng bộ, định dạng số tabular-nums cho tiền tệ, trạng thái tải và lỗi có hỗ trợ thử lại, tuân thủ nguyên tắc thiết kế hiện đại.
