# Kịch Bản Trình Diễn Hệ Thống (Demo Script) — Edumy Ecosystem (v2)

Tài liệu hướng dẫn trình diễn liên thông giữa **Edumy Web (SPA)**, **Edumy Mobile (Expo App)** và **Edumy Backend (Spring Boot Modulith)**.

---

## 1. Chuẩn bị môi trường trước buổi Demo

1. **Khởi chạy Backend (profile `dev`):**
   ```bash
   cd Edumy-main/Edumy/Backend
   .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
   ```
   > Lắng nghe trên `http://localhost:5000/api/v1` (mặc định `hold-days: 0` ở chế độ demo).
2. **Khởi chạy Frontend Web:**
   ```bash
   cd Edumy-main/Edumy/Frontend
   npm run dev
   ```
   > Chạy trên `http://localhost:3000`.
3. **Khởi chạy Mobile App (`Edumy-App`):**
   - Trên Android Emulator: `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api/v1`.
   - Trên thiết bị thật cùng LAN: đổi cả `EXPO_PUBLIC_API_BASE_URL` và `EXPO_PUBLIC_WEB_BASE_URL` sang **IP LAN** của máy tính (không dùng `localhost`).
   ```bash
   cd Edumy-App
   npx expo start
   ```

---

## 2. Kịch bản Demo

### 🎬 Màn 1: Khám phá, Ghi danh & Chuyển hướng mua trên Website (`BR-MOBILE-SCOPE`)
1. Mở Tab **Khám phá**: tìm kiếm / lọc khóa học.
2. Mở một khóa học trả phí → hiển thị nút **"Mua trên website"** (không có giỏ hàng hay thanh toán trong app) → bấm mở `${WEB_BASE_URL}/courses/{id}` qua trình duyệt tích hợp (`expo-web-browser`).
3. Thanh toán trên Web → quay lại app (foreground sync) → khóa học xuất hiện ngay trong Tab **Học tập**.
4. Với khóa học miễn phí → bấm **"Ghi danh miễn phí"** để vào thẳng Phòng học.

### 🎬 Màn 2: Phòng học, Q&A và Chứng chỉ đồng bộ với Web
1. Hoàn thành một bài học trên **Web** → quay lại app → tiến độ % và nút **"Học tiếp"** cập nhật khớp 100% với Web.
2. Mở bài kiểm tra (quiz) → hiển thị **"Bài kiểm tra — làm trên website"** để đảm bảo tính tiến độ đồng nhất.
3. Hoàn thành 100% khóa học → hiển thị chúc mừng kèm mã `EDUMY-…`. Mở **Chứng chỉ tốt nghiệp** → tải PDF (native) hoặc mở & sao chép link xác thực `/certificates/verify/{code}`.

### 🎬 Màn 3: Kênh giảng viên & Rút tiền theo kỳ hạn cuốn chiếu (`BR-PAY-HOLD`)
1. Đăng nhập `instructor@edumy.com` → Tab **Giảng viên** hiển thị 5 phần: **Tổng quan**, **Khóa học**, **Hỏi đáp**, **Thu nhập**, **Rút tiền**.
2. Xem **Tổng quan**: KPI (hiển thị tách bạch **"Doanh số bán"** và **"Thu nhập thực nhận"**), biểu đồ 30 ngày, badge câu hỏi chờ trả lời & lời mời đồng giảng viên.
3. Xem **Thu nhập**: hiển thị giải thích `BR-PAY-HOLD` theo `holdDays` từ server (`0` ngày ở profile `dev`) và trạng thái khả dụng của từng bút toán.
4. Tạo yêu cầu rút tiền (`100.000 đ`, khóa nút chống bấm đúp) → admin duyệt trên Web → app quay lại foreground hiển thị **"Đã chuyển khoản"** kèm mã giao dịch và cập nhật số dư.
