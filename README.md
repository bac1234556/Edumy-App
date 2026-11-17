# Edumy Mobile App 📱

Ứng dụng di động học trực tuyến **Edumy Mobile** xây dựng trên nền tảng **React Native (Expo SDK 51+)** và **Expo Router**, kết nối đồng bộ 100% thời gian thực với hệ thống máy chủ trung tâm **Spring Boot Modulith** và cơ sở dữ liệu **SQL Server**.

[![React Native](https://img.shields.io/badge/Mobile-React%20Native%20%7C%20Expo-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TanStack Query](https://img.shields.io/badge/State-TanStack%20Query-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Tests](https://img.shields.io/badge/Jest-106%20passed-brightgreen?logo=jest)](https://jestjs.io/)

---

## 📌 Tổng quan kiến trúc & Tính năng

- **Một nguồn dữ liệu chân thực (Single Source of Truth):** 1 Database SQL Server, 1 Backend Spring Boot (`port 5000`), chia sẻ dữ liệu liên thông giữa Web SPA (`port 3000`) và Mobile App.
- **Xác thực bảo mật cao (NFR-M01, NFR-M02):** Access token chỉ lưu trên RAM (Zustand store). Refresh token lưu trong Keychain / Keystore (`expo-secure-store`) trên Android/iOS, và **chỉ lưu trong bộ nhớ RAM** trên trình duyệt web (`expo start --web`, không dùng `localStorage`, nên khi reload trang trên web người dùng cần đăng nhập lại). Áp dụng quay vòng token (token rotation) và phát hiện tái sử dụng (reuse detection). Không dùng AsyncStorage cho thông tin nhạy cảm.
- **Tuân thủ chính sách chợ ứng dụng (BR-M01):** Mobile **không thực hiện thanh toán in-app**. Giỏ hàng đồng bộ hai chiều, thanh toán chuyển hướng an toàn về Web `${EXPO_PUBLIC_WEB_BASE_URL}/cart`.
- **Phòng học & Tiến độ (Learning & Progress):** Phát video chuẩn qua `expo-video` (fallback WebView), ghi nhận lượt xem (`visit`), đánh dấu hoàn thành thủ công (D-33), chúc mừng và tải chứng chỉ PDF có chữ ký số.
- **Hỏi & Đáp (Q&A) & Đánh giá (Review):** Diễn đàn trao đổi theo từng bài học/khóa học, đánh dấu câu hỏi đã giải quyết, đánh giá 1–5 sao kèm nhận xét.
- **Chế độ Doanh thu Giảng viên (Instructor Money Mode - Phân hệ 06):**
  - Tab Giảng viên tự động bật dựa trên vai trò hoặc khi phát sinh doanh thu (BR-53).
  - Bảng tổng kết số dư: Khả dụng, Chờ đáo hạn, Đang rút, Đã rút và Tổng thu nhập.
  - Phân tích chi tiết theo khóa học (Giảng viên chính / Đồng giảng viên) và theo tháng.
  - Quản lý tài khoản nhận tiền (che chỉ hiện 4 số cuối, bảo mật bằng mật khẩu tài khoản).
  - Tạo yêu cầu rút tiền (tối thiểu 100.000 đ) với các chip nhanh, xử lý đầy đủ các mã lỗi máy chủ và hỗ trợ hủy yêu cầu đang chờ xử lý.

---

## 🛠️ Yêu cầu môi trường & Cài đặt

### 1. Yêu cầu hệ thống
- **Node.js:** v18 trở lên (khuyến nghị v20+ LTS).
- **Trình quản lý gói:** `npm` (đi kèm Node).
- **Backend Edumy:** Spring Boot chạy trên `http://localhost:5000/api/v1` (profile `dev`).

### 2. Cài đặt các gói phụ thuộc
```bash
cd c:\Users\bacle\Downloads\Edumy-App
npm install
```

### 3. Cấu hình biến môi trường (`.env`)
Tạo hoặc cập nhật tệp `.env` tại thư mục gốc:
```env
# URL kết nối tới Backend Spring Boot
# Đối với Android Emulator: dùng 10.0.2.2 thay vì localhost
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api/v1

# Đối với thiết bị vật lý qua mạng LAN:
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.xxx:5000/api/v1

# URL của website Edumy (dùng cho thanh toán giỏ hàng, xác thực chứng chỉ)
EXPO_PUBLIC_WEB_BASE_URL=http://localhost:3000
```

---

## 🚀 Khởi chạy ứng dụng

### 1. Khởi chạy Expo Dev Server
```bash
npx expo start
```

### 2. Chạy trên thiết bị
- **Android Emulator:** Nhấn phím `a` trong terminal sau khi đã mở sẵn AVD trong Android Studio.
- **iOS Simulator (macOS):** Nhấn phím `i`.
- **Thiết bị thật:** Cài đặt ứng dụng **Expo Go** trên điện thoại, quét mã QR hiển thị trong terminal (đảm bảo điện thoại và máy tính cùng mạng Wi-Fi và cấu hình IP LAN).

---

## 🧪 Kiểm thử & Đảm bảo chất lượng

Dự án áp dụng bộ kiểm thử toàn diện với **0 lỗi biên dịch, 0 cảnh báo lint và 100% test pass**:

```bash
# 1. Kiểm tra an toàn kiểu dữ liệu TypeScript (Strict mode)
npm run typecheck

# 2. Kiểm tra quy chuẩn mã nguồn ESLint
npm run lint

# 3. Chạy toàn bộ 106 bài kiểm thử đơn vị với Jest
npm test
```

### Kết quả kiểm thử hiện tại:
- **Test Suites:** 16 passed, 16 total
- **Tests:** 106 passed, 106 total
- **Snapshots:** 0
- **Thời gian chạy:** ~4.5s

---

## 📚 Tài liệu chi tiết
- **Kịch bản Demo liên thông 3 phân hệ:** [`docs/demo-script.md`](docs/demo-script.md)
- **Bảng đối chiếu kiểm toán tiêu chí chấp nhận (AC-M01 … AC-M18):** [`docs/ai/ac-checklist.md`](docs/ai/ac-checklist.md)
- **Hợp đồng API chi tiết (API Contract):** [`docs/ai/api-contract.md`](docs/ai/api-contract.md)
- **Tiến độ triển khai (Progress Tracker):** [`docs/ai/progress.md`](docs/ai/progress.md)
