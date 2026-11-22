# EDU-TER-M-001 — BÁO CÁO MÔI TRƯỜNG & DỮ LIỆU KIỂM THỬ EDUMY MOBILE (TEST ENVIRONMENT REPORT)

> **Chuẩn áp dụng**: ISO/IEC/IEEE 29119-3 · OWASP MASVS v2 (Không lưu mật khẩu, token hoặc số tài khoản đầy đủ trong tài liệu).

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Mã tài liệu** | `EDU-TER-M-001` |
| **Ngày thiết lập** | `2026-11-22` (Asia/Ho_Chi_Minh) |
| **Commit Ứng dụng Mobile** | `Edumy-App@6cf1e9e` (Expo SDK 51, React Native 0.74.5, Expo Router 3.5.24, TanStack Query 5.105.1, Zustand 4.5.5) |
| **Commit Backend & Web** | `Edumy-main@260de6b` (Spring Boot 3.2.0 Modulith, SQL Server 2022, Mailpit v1.32.0) |
| **Máy chủ kiểm thử (Host)** | Windows 10/11 x64 (`win32`), Node.js `v24.16.0`, Docker Engine `29.9.2`, Google Chrome `157.0.0.0` |

---

## 1. Cấu trúc Môi trường Kiểm thử Cô lập (`edumy-test` + `Edumy-App`)

### 1.1. Stack Backend & Dịch vụ Phụ trợ (`docker-compose.test.yml` — project `edumy-test`)
| Dịch vụ | Container | Cổng Host → Container | Vai trò trong Kiểm thử Mobile | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **SQL Server 2022** | `edumy-test-database-1` | `14334 → 1433` | CSDL trung tâm `EduMyDb` dùng chung Web & Mobile | Healthy |
| **Spring Boot Backend** | `edumy-test-backend-1` | `5001 → 5000` | REST API `/api/v1` (envelope v2) & OpenAPI `/v3/api-docs` | Healthy |
| **Edumy Web SPA (Nginx)** | `edumy-test-frontend-1` | `3002 → 80` | Đích Web-Handoff (`${WEB_BASE_URL}/courses/{id}`) & kiểm thử đồng bộ chéo Web ↔ App | Running |
| **Mailpit** | `edumy-test-mailpit-1` | `1026 → 1025`, `8026 → 8025` | Kiểm chứng email xác thực, quên mật khẩu, trả lời Q&A | Healthy |
| **Prometheus / Grafana** | `edumy-test-prometheus-1` / `grafana-1` | `9091 → 9090`, `3003 → 3000` | Giám sát metric trong bài kiểm thử tải 50 CCU | Running |

### 1.2. Cấu hình Biến Môi trường Ứng dụng Mobile (`src/config/env.ts`)
- `EXPO_PUBLIC_API_BASE_URL=http://localhost:5001/api/v1` *(trên Android Emulator tương đương `http://10.0.2.2:5001/api/v1`; `env.ts` tự động ánh xạ `10.0.2.2` sang `localhost` khi chạy trên `Platform.OS === 'web'`)*.
- `EXPO_PUBLIC_WEB_BASE_URL=http://localhost:3002` *(đích mở `expo-web-browser` cho nút `"Mua trên website"`, `"Bài kiểm tra — làm trên website"` và xác minh chứng chỉ)*.
- `EXPO_PUBLIC_ADMOB_BANNER_ID` / `EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID`: để trống trong môi trường test để ứng dụng tự động dùng **Google Official Test IDs** (`TestIds.BANNER`, `TestIds.INTERSTITIAL`).

### 1.3. Trạng thái Nền tảng Thiết bị (Platform Matrix)
| Nền tảng | Công cụ / Môi trường | Kích thước / Cấu hình | Khả dụng trên Host | Ghi chú |
| :--- | :--- | :--- | :---: | :--- |
| **`Jest`** | `jest-expo` ~51.0.4 + `@testing-library/react-native` 12.9.0 + `axios-mock-adapter` 2.1.0 | Node.js `v24.16.0` | **Sẵn sàng (100%)** | Thực thi Unit, Component, Hook & Architecture tests |
| **`Web`** | `npx expo start --web` + Google Chrome `157.0.0.0` (Chrome DevTools MCP) + Node Contract/Perf Runner | Mobile viewport `360x800` & Desktop `1366x768` | **Sẵn sàng (100%)** | Thực thi E2E UI, Contract (`ajv` 8.20.0), 50 CCU Performance, Cross-sync Web ↔ App |
| **`Android-30`** | Android Emulator API 30 | Màn hình `360dp` | **Blocked (Chưa cài SDK/AVD)** | Máy host Windows không có `%LOCALAPPDATA%\Android\Sdk` / `adb` / `emulator` |
| **`Android-34`** | Android Emulator API 34 | Màn hình lớn / Tablet | **Blocked (Chưa cài SDK/AVD)** | Ghi nhận `Blocked` trung thực theo Mục 0 đề bài |
| **`iOS`** | Apple iOS Simulator (Xcode) | iPhone Simulator | **Blocked (Windows OS)** | Yêu cầu macOS + Xcode |

---

## 2. Dữ liệu Kiểm thử Chuẩn hóa (Seeded Test Data — Mật khẩu đã che `***`)

### 2.1. Danh mục Tài khoản Kiểm thử
| Mã Vai trò | Email | Mật khẩu | Trạng thái | Đặc điểm dữ liệu phục vụ kiểm thử Mobile |
| :--- | :--- | :---: | :---: | :--- |
| **`HV1`** | `qa.hv1@edumy.test` | `***` | Active (`emailVerified=true`) | Đã sở hữu khóa miễn phí `47`, `48` và khóa trả phí `49`; đã có chứng chỉ số `EDUMY-...` và câu hỏi Q&A. |
| **`HV2`** | `qa.hv2@edumy.test` | `***` | Active (`emailVerified=true`) | Học viên chưa ghi danh khóa trả phí (`49`, `50`), dùng test `resolveCourseAction`, ghi danh miễn phí, cấp chứng chỉ mới `AC-M08`, IDOR. |
| **`HV-LOCKED`** | `qa.hvlocked@edumy.test` | `***` | **Locked** (`IsActive=0`) | Dùng kiểm thử chặn đăng nhập & khôi phục phiên `403 AUTH_ACCOUNT_LOCKED`. |
| **`HV-UNV`** | `qa.hvunverified@edumy.test` | `***` | Active (`emailVerified=false`) | Dùng kiểm thử banner nhắc xác thực email & gửi lại email cooldown 60s (`429 Retry-After`). |
| **`GV-A`** | `qa.gva@edumy.test` | `***` | Active (`INSTRUCTOR`) | Giảng viên chính của các khóa `43..50`, có doanh thu, số dư khả dụng `>= 2.500.000 đ`, tài khoản nhận tiền (`•••• 5544`), hàng đợi Q&A. |
| **`GV-B`** | `qa.gvb@edumy.test` | `***` | Active (`INSTRUCTOR`) | Giảng viên độc lập (chưa cấu hình tài khoản nhận tiền lúc đầu / dùng test `PAYOUT_ACCOUNT_REQUIRED` & IDOR chéo giảng viên). |
| **`GV-CO`** | `qa.gvco@edumy.test` | `***` | Active (`INSTRUCTOR`) | Đồng giảng viên có lời mời cộng tác chờ xử lý (`UC-I14`, `UC-I15`) và chia sẻ doanh thu (`shareBps`). |
| **`GV-REV`** | `qa.gvrevoked@edumy.test` | `***` | Active (`STUDENT`, thu hồi GV) | Không còn role `INSTRUCTOR` nhưng có `hasEarnings=true` -> dùng kiểm thử `shouldShowInstructorTab` (`D-M01`). |
| **`ADM1`** | `admin@edumy.com` | `***` | Active (`ADMIN`) | Dùng tạo tiền điều kiện phía server (ẩn đánh giá `AC-30`, duyệt/hiện khóa học). |

### 2.2. Danh mục Khóa học Kiểm thử Trọng tâm
| Mã Khóa | ID / Slug | Giá (VND) | Trạng thái | Đặc điểm kiểm thử |
| :--- | :--- | ---: | :---: | :--- |
| **`cFree3`** | `47` / `lap-trinh-java-co-ban-mien-phi-*` | `0` (`Miễn phí`) | `Published` | 3 bài học (`168, 169, 170`), có bài học thử, dùng test ghi danh miễn phí & hoàn thành 100% nhận chứng chỉ `AC-M08`. |
| **`cFree10`** | `48` / `khoa-hoc-chung-chi-10-bai-tieng-viet-*` | `0` (`Miễn phí`) | `Published` | 10 bài học tiếng Việt có dấu, dùng kiểm thử tiến độ & chứng chỉ PDF tiếng Việt. |
| **`cPaid1`** | `49` / `lap-trinh-java-nang-cao-spring-boot-*` | `300.000 đ` | `Published` | Khóa trả phí có bài học thử (`181`), bài không học thử (`182`), và **Quiz ID `79`** ("Bài kiểm tra — làm trên website"). |
| **`cPaidSplit`** | `50` / `kien-truc-microservices-dong-giang-vien-*` | `500.000 đ` | `Published` | Khóa trả phí có đồng giảng viên `GV-CO`, HV2 chưa sở hữu (test `403 NOT_ENROLLED` & nút `"Mua trên website"`). |
| **`cHidden`** | `46` / `qa-khoa-da-an-hidden-*` | `200.000 đ` | `Hidden` | Khóa học bị ẩn -> trả `404 COURSE_NOT_FOUND` ("Không tìm thấy khóa học") với người chưa sở hữu. |
| **Catalog Pool** | `>= 25` khóa công khai | `0 đ` .. `1.500.000 đ` | `Published` | Đủ phân trang (`size=20`), đa dạng danh mục, giá và điểm đánh giá để test `SortPicker` & Pairwise filters. |

---

## 3. Kết quả Kiểm tra Tiêu chí Bắt đầu (Entry Criteria Verification)

- `npx tsc --noEmit`: **PASS (`exit code 0`, 0 lỗi)**
- `npm run lint` (`eslint . --max-warnings=0`): **PASS (`exit code 0`, 0 lỗi, 0 warning)**
- `npm test -- --coverage`: **PASS (`19/19 suites`, `128/128 tests PASS`, `78.1%` statements coverage)**
- Backend `edumy-test` (`http://localhost:5001/api/v1`): **Healthy & Seeded**
