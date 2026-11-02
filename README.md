# Edumy — Nền Tảng Học Trực Tuyến Trên Android 🎓📱

[![React Native](https://img.shields.io/badge/Mobile-React%20Native%20%7C%20Expo-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Container-Docker%20Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)

---

## 📌 Giới thiệu dự án

**Edumy** là ứng dụng di động học trực tuyến lấy cảm hứng từ mô hình Udemy, hỗ trợ 3 nhóm đối tượng người dùng chính:
- 👨‍🎓 **Student (Học viên):** Khám phá, tìm kiếm và lọc khóa học theo danh mục; lưu wishlist; thanh toán khóa học (mock / VNPay sandbox); theo dõi tiến độ bài học qua video player; đặt câu hỏi thảo luận (Q&A); viết đánh giá và nhận chứng chỉ hoàn thành (PDF).
- 👨‍🏫 **Instructor (Giảng viên):** Tạo và quản lý khóa học (Khóa học → Chương học → Bài giảng video); tải video trực tiếp lên Cloudinary; gửi khóa học phê duyệt; theo dõi doanh thu và thống kê học viên.
- 👨‍💼 **Admin (Quản trị viên):** Kiểm duyệt khóa học trước khi xuất bản; quản lý tài khoản người dùng (khóa/mở khóa); quản lý danh mục; theo dõi tổng quan các chỉ số toàn hệ thống.

---

## 🏗️ Cấu trúc Monorepo

Dự án áp dụng mô hình kiến trúc **Monorepo** chia theo các tầng độc lập:

```text
Edumy-App/
├── backend/                  # Spring Boot RESTful API (Java 21, Spring Security, JPA, Flyway)
├── mobile/                   # React Native (Expo Router, React Native Paper, TanStack Query)
├── docs/                     # Toàn bộ tài liệu kỹ thuật, kế hoạch và tài nguyên dự án
│   ├── PROJECT_PLAN.md       # Kế hoạch chi tiết 4 tuần (D1 - D28)
│   ├── FEATURES_AND_VISION.md# Tổng quan chức năng & Tính ứng dụng thực tế
│   ├── scope-and-backlog.md  # Khóa phạm vi MVP & Quản lý Backlog (W7-T1)
│   ├── ERD.md & erd.png      # Sơ đồ CSDL tổng thể (MySQL 8, DBML) (W7-T1)
│   ├── wireframes.md & .png  # Thiết kế Wireframe giao diện 5 modules (W7-T1)
│   ├── api-conventions.md    # Quy ước chuẩn API RESTful & Response Wrapper (W7-T1)
│   └── *.docx                # File Word kế hoạch gốc
└── .github/                  # GitHub Actions CI, Pull Request Template & Issue Templates
```

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### 📱 Mobile App (Android)
- **Framework:** React Native + Expo SDK 51+ (Expo Router file-based routing)
- **UI System:** React Native Paper (Material Design)
- **Data & State:** Axios, TanStack Query (React Query) cho server state, Zustand cho authentication state
- **Media Player:** `expo-video` cho luồng phát video streaming
- **Build tool:** EAS Build / Expo Prebuild

### 💻 Backend API
- **Nền tảng:** Java 21 + Spring Boot 3.3.x / 3.4.x
- **Bảo mật:** Spring Security 6 + JWT (jjwt) không trạng thái (Stateless Authentication)
- **Truy xuất dữ liệu:** Spring Data JPA + JPA Specification (hỗ trợ dynamic search/filter đa tiêu chí)
- **Cơ sở dữ liệu:** MySQL 8 chạy qua Docker Compose, quản lý migration phiên bản bằng **Flyway**
- **Tài liệu API:** Springdoc-OpenAPI (Swagger UI) tự động sinh tài liệu
- **Sinh file:** OpenPDF tạo chứng chỉ tốt nghiệp tự động

### ☁️ Dịch vụ đám mây & Tiện ích
- **Lưu trữ đa phương tiện:** Cloudinary (Signed Direct Upload từ Mobile)
- **Cổng thanh toán:** VNPay Sandbox (kèm chế độ Mock Checkout dự phòng)
- **CI/CD:** GitHub Actions (Build Maven + Lint JavaScript)

---

## 👥 Phân công nhiệm vụ (Mô hình Vertical Slice)

Mỗi thành viên phụ trách trọn vẹn một module end-to-end (Database → API → Giao diện):

| Thành viên | Phân hệ Module | Trách nhiệm chính |
| :--- | :--- | :--- |
| **Member A** | **Platform & Auth (Tech Lead)** | Hệ thống xác thực JWT, hạ tầng Monorepo, Docker Compose, CI/CD, đóng gói APK, cấu hình chung |
| **Member B** | **Catalog & Review** | Trang chủ, danh mục, tìm kiếm & bộ lọc khóa học, Wishlist, Đánh giá & Xếp hạng (Review/Rating) |
| **Member C** | **Instructor Studio** | Quản lý khóa học/chương/bài học, tải video lên Cloudinary, trình duyệt khóa, thống kê giảng viên |
| **Member D** | **Enrollment, Learning & Certificate** | Giỏ hàng/đơn hàng, Mock Checkout & VNPay, Trình phát video bài học, cấp chứng chỉ PDF |
| **Member E** | **Admin & Community** | Hàng chờ duyệt khóa học, quản lý người dùng, quản lý danh mục, Q&A bài học, thông báo in-app |

---

## 📅 Lộ trình thực hiện 4 tuần (D1 — D28)

- **Tuần 7 (D1 – D7) · Foundation:** Khởi tạo kiến trúc, thiết lập DB schema, đăng nhập/đăng ký thật, khung UI mock.
- **Tuần 8 (D8 – D14) · Core Flow:** Thông luồng Happy Path (Tạo khóa → Duyệt khóa → Mua khóa → Học video).
- **Tuần 9 (D15 – D21) · Extended Features:** Review & Rating, Q&A, Chứng chỉ PDF, Dashboard thống kê. *(D21: Feature Freeze)*.
- **Tuần 10 (D22 – D28) · Stabilize & Release:** Bug bash, tích hợp VNPay Sandbox, hoàn thiện báo cáo và đóng gói APK Release v1.0. *(D25: Code Freeze)*.

Chi tiết phân công từng ngày và từng thành viên xem tại:
👉 **[Kế Hoạch Dự Án Chi Tiết (docs/PROJECT_PLAN.md)](docs/PROJECT_PLAN.md)**  
👉 **[Hệ Thống Chức Năng & Tính Ứng Dụng Thực Tế (docs/FEATURES_AND_VISION.md)](docs/FEATURES_AND_VISION.md)**

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Step-by-Step Setup)

> Mục tiêu: Đảm bảo bất kỳ thành viên nào trong nhóm hoặc người chấm khi clone dự án về đều có thể tự cài đặt và chạy thành công mà không gặp trở ngại.

### 1. Yêu cầu môi trường chuẩn bị (Prerequisites)
- **Java Development Kit (JDK):** Phiên bản **21** (Khuyên dùng [Eclipse Temurin 21](https://adoptium.net/) hoặc Oracle OpenJDK 21).
- **Node.js:** Phiên bản **v18.x** hoặc **v20.x LTS** kèm `npm` (hoặc `yarn`).
- **Docker & Docker Compose:** Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) (dùng để chạy container MySQL 8).
- **Thiết bị chạy Mobile:**
  - Thiết bị Android thật cài sẵn ứng dụng **Expo Go** từ Google Play Store, **hoặc**
  - Trình giả lập Android Studio (Android Emulator).

---

### 2. Khởi động Cơ sở dữ liệu (MySQL 8)
Dự án đã cấu hình sẵn file `docker-compose.yml` chuẩn tại thư mục gốc:

```bash
# Tại thư mục gốc của dự án (Edumy-App):
docker compose up -d
```

*Thông số kết nối mặc định của CSDL:*
- **Host / Port:** `localhost:3306`
- **Database:** `edumy_db`
- **Username:** `edumy_user`
- **Password:** `edumy_password`

---

### 3. Cài đặt và Chạy Backend (Spring Boot 3 API)

1. Mở cửa sổ Terminal và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```

2. Khởi chạy ứng dụng Spring Boot:
   - Trên **Windows (PowerShell / CMD)**:
     ```powershell
     mvn spring-boot:run
     ```
   - *Cách khác:* Mở thư mục `backend` bằng **IntelliJ IDEA**, đợi Maven đồng bộ thư viện (dependencies) và nhấn nút **Run** tại file `com.edumy.BackendApplication`.

3. Cơ chế **Flyway Migration** sẽ tự động khởi tạo toàn bộ bảng trong cơ sở dữ liệu và nạp dữ liệu mẫu ban đầu (admin user, danh mục, v.v.).

4. **Kiểm tra hoạt động:**
   - Truy cập tài liệu API tự động (Swagger UI):  
     👉 [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
   - Kiểm tra API Docs JSON:  
     👉 [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

### 4. Cài đặt và Chạy Ứng dụng Mobile (React Native / Expo)

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục `mobile`:
   ```bash
   cd mobile
   ```

2. Cài đặt các gói phụ thuộc (Dependencies):
   ```bash
   npm install
   ```

3. Khởi chạy Expo Dev Server:
   ```bash
   npm start
   # hoặc: npx expo start
   ```

4. **Trải nghiệm ứng dụng:**
   - **Trên điện thoại Android thật:** Mở ứng dụng **Expo Go**, chọn *Scan QR Code* và quét mã QR hiển thị trên màn hình Terminal (lưu ý điện thoại và máy tính kết nối cùng mạng Wi-Fi hoặc sử dụng `npx expo start --tunnel`).
   - **Trên Android Emulator:** Nhấn phím `a` trên cửa sổ Terminal sau khi Expo khởi động.
   - **Trên Trình duyệt Web:** Nhấn phím `w` trên Terminal để chạy bản xem trước giao diện.

---

### 5. Kiểm thử các màn hình trên ứng dụng Mobile
Ứng dụng đã được tích hợp thanh điều hướng nhanh ở cuối màn hình giúp việc chấm điểm và review thuận tiện:
- 🏠 **Trang chủ (Home):** Danh mục khóa học, thanh tìm kiếm, danh sách khóa học nổi bật (Issue [W7-B3]).
- 📚 **Khóa học (Course Detail):** Chi tiết bài giảng, thông tin giảng viên, đề cương chương học.
- 🛡️ **Admin Dashboard:** 4 thẻ chỉ số thống kê (Học viên, Khóa học, Doanh thu, Khóa chờ duyệt), lối tắt tác vụ nhanh và nhật ký hoạt động gần đây (Issue [W7-E3]).
- 👥 **Quản lý người dùng (Users):** Danh sách người dùng, thanh tìm kiếm họ tên/email, chip lọc theo vai trò (*Tất cả / Học viên / Giảng viên / Quản trị viên*), trạng thái hoạt động và tính năng khóa/mở khóa tài khoản (Issue [W7-E3]).

---

## 💡 Giá trị & Tính ứng dụng thực tế

- 🎓 **Học viên:** Tự học linh hoạt mọi lúc mọi nơi, ghi nhớ tiến độ bài học, nhận chứng chỉ hoàn thành xác thực.
- 👨‍🏫 **Giảng viên:** Phân phối nội dung số hóa rộng rãi, tạo nguồn thu nhập thụ động bền vững từ tri thức.
- 🏛️ **Cơ sở đào tạo:** Chuyển đổi số mô hình học kết hợp (Blended Learning), quản lý nội dung và học viên tập trung.
- 🏢 **Doanh nghiệp:** Chuẩn hóa quy trình Onboarding nhân sự và bồi dưỡng chuyên môn liên tục (Upskilling) tiết kiệm chi phí.
- 💼 **Đơn vị vận hành:** Mô hình kinh doanh thương mại điện tử khóa học số, phân tích dữ liệu học tập (Learning Analytics).

---

## 📜 Quy ước làm việc trên GitHub

1. **Quy tắc nhánh (Git Flow):**
   - `main`: Chỉ chứa mã nguồn các bản release đã kiểm thử đạt chuẩn.
   - `develop`: Nhánh tích hợp chính.
   - Nhánh tính năng / sửa lỗi: `feature/<issue-number>-<slug>` hoặc `fix/<issue-number>-<slug>`.
2. **Quy chuẩn commit:** Tuân thủ [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(catalog): add course search by keyword and category API`
   - `fix(auth): handle expired refresh token gracefully in axios interceptor`
3. **Quy trình Pull Request (PR):**
   - Mọi commit phải thông qua PR có gắn `Closes #<issue_number>`.
   - Mỗi PR phải có tối thiểu **1 Approve** từ vòng review chéo trước khi merge vào `develop`.
4. **Tiêu chuẩn hoàn thành (Definition of Done - DoD):**
   - Code đã merge vào develop qua PR được approve.
   - API có tài liệu trên Swagger, validate dữ liệu đầy đủ.
   - Màn hình Mobile có đủ 3 trạng thái: *Loading*, *Empty Data*, *Error*.
   - Đã kiểm thử trực tiếp trên thiết bị Android hoặc Emulator.
