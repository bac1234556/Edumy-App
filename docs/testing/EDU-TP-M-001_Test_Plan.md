# EDU-TP-M-001 — KẾ HOẠCH KIỂM THỬ HỆ THỐNG EDUMY MOBILE (SYSTEM TEST PLAN)

> **Chuẩn áp dụng**: ISO/IEC/IEEE 29119-2 (Quy trình) · ISO/IEC/IEEE 29119-3 (Tài liệu) · ISO/IEC/IEEE 29119-4 (Kỹ thuật thiết kế kiểm thử) · ISO/IEC 25010 (Chất lượng phần mềm) · OWASP MASVS v2 (STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE, RESILIENCE).

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Mã tài liệu** | `EDU-TP-M-001` |
| **Phiên bản** | `1.0` |
| **Ngày lập** | `2026-11-22` (Asia/Ho_Chi_Minh) |
| **Đối tượng kiểm thử (SUT)** | **Edumy Mobile (`Edumy-App`)** — Expo SDK 51, React Native 0.74.5, Expo Router 3.5, TanStack Query v5, Zustand v4, TypeScript strict |
| **Backend kết nối** | **Edumy Backend** (Spring Boot 3.2.0 Modulith, REST `/api/v1`, envelope v2) chạy trên stack Docker cô lập `edumy-test` (`http://localhost:5001/api/v1`) |
| **Commit cơ sở** | `Edumy-App@6cf1e9e` · `Edumy-main@260de6b` |
| **Tác giả / Vai trò** | QA / Test Lead độc lập |

---

## 1. Giới thiệu & Bối cảnh (Introduction & Context)

### 1.1. Mục đích
Tài liệu này xác định kế hoạch kiểm thử toàn diện (chức năng, hợp đồng API và phi chức năng) cho ứng dụng di động **Edumy Mobile (`Edumy-App`)** kết nối đồng bộ với hệ thống Backend trung tâm **Edumy** theo hợp đồng `api-contract-v2.md`. Mục tiêu là kiểm chứng khách quan, có bằng chứng thực thi thật cho toàn bộ 10 nhóm Test Items (`M-M01`..`M-M08`, `M-API`, `M-REG`), đảm bảo tuân thủ nghiêm ngặt quy tắc phạm vi **`BR-MOBILE-SCOPE`** (Ứng dụng = Học tập + Kênh giảng viên; tuyệt đối không có giỏ hàng, đơn hàng, thanh toán hoặc biên soạn khóa học).

### 1.2. Cơ sở kiểm thử (Test Basis) & Thông báo thiếu tài liệu gốc
1. **Tài liệu hiện hữu đã đọc và đối chiếu**:
   - `Edumy-App/AGENTS.md` và bộ quy tắc `.agents/rules/10-architecture.md` .. `60-testing.md`.
   - `Edumy-App/docs/ai/api-contract-v2.md` (33 endpoint Mobile v2, envelope `{success, message, data, errors}`).
   - `Edumy-App/docs/ai/openapi.json` và `src/api/schema.d.ts`.
   - `Edumy-App/docs/ai/ac-checklist.md` (`BR-MOBILE-SCOPE`, `AC-M01`..`AC-M18`).
   - Toàn bộ 25 route trong `Edumy-App/app/**` và 9 feature trong `Edumy-App/src/features/**` (`auth`, `catalog`, `learning`, `qa`, `reviews`, `certificates`, `profile`, `instructor`, `ads`).
2. **Thông báo và Giả định về tài liệu chưa có trong repo (Bắt buộc báo cáo)**:
   - Qua rà soát toàn bộ workspace, hai tệp `docs/requirements/EDU-MOB-SRS-001.md` và `docs/testing/master/EDU-MTP-001_Master_Test_Plan.md` **chưa tồn tại trong repo**.
   - **Giả định áp dụng theo đúng chỉ dẫn đề bài**: Sử dụng tổ hợp `docs/ai/ac-checklist.md` (`BR-MOBILE-SCOPE`, `AC-M01..AC-M18`) + `.agents/rules/10..60` + `docs/ai/api-contract-v2.md` + `docs/ai/openapi.json` + các Use Case/Business Rules/NFR thuộc kênh Mobile từ `EDU-SRS-001 v3.0` làm Test Basis chính thức. Quy ước định danh, schema CSV/Excel và công thức tính số đo tuân theo chuẩn đã phê duyệt ở đợt kiểm thử Web (`EDU-TP-W-001`) và Mục 5, 8 của đề bài Mobile.

---

## 2. Phạm vi Kiểm thử (Scope)

### 2.1. Các Hạng mục trong Phạm vi (Test Items — 10 Module)

| Mã Module | Tên Module | Phạm vi yêu cầu, Route & Feature kiểm thử |
| :--- | :--- | :--- |
| **`M-M01`** | **Xác thực & Phiên** | `/auth/mobile/{login,register,refresh,logout}`, `/auth/forgot-password`, `/auth/verification-email/resend`; khôi phục phiên `AC-M03` (`useRestoreSession`, giữ token khi lỗi mạng + banner offline); refresh single-flight + `sessionEpoch` guard; đăng xuất `AC-M04` (`queryClient.clear`, xóa SecureStore/memory); đổi mật khẩu thu hồi mọi thiết bị; tài khoản bị khóa (`403 AUTH_ACCOUNT_LOCKED`). |
| **`M-M02`** | **Khám phá (Catalog)** | Danh sách khóa học, tìm kiếm có dấu/không dấu (`UC-G02`, `D-09`), lọc danh mục/giá, `SortPicker` 4 kiểu (`newest`, `rating`, `price_asc`, `price_desc` — `UC-G03`), chi tiết khóa `/courses/[slug]` + `resolveCourseAction` đủ 5 nhánh (`BR-MOBILE-SCOPE`), học thử `preview/[lessonId]` (`UC-G11`), danh sách đánh giá, khóa bị ẩn trả `404` ("Không tìm thấy khóa học"). |
| **`M-M03`** | **Ghi danh & Học tập** | Ghi danh miễn phí (`UC-S15`), tab Học tập `AC-M01` (`useInfiniteQuery`, `%` từ server, nút "Học tiếp"), phòng học `/learn/[courseId]` (chương, bài, quiz hiển thị "Bài kiểm tra — làm trên website"), bài học `AC-M02` (`/learn/lesson/[lessonId]`: visit, Bài trước/Bài sau, hoàn thành thủ công, video `expo-video` / `WebView`, bài đọc fallback), cấp chứng chỉ tự động `AC-M08` (`certificateJustIssued`), đồng bộ chéo Web ↔ App. |
| **`M-M04`** | **Tương tác (Q&A & Đánh giá)** | Hỏi đáp `AC-M09` (`/learn/[courseId]/qa`, `/learn/qa/[questionId]`: đặt câu hỏi, lọc, chi tiết luồng, phản hồi, đánh dấu giải quyết `{resolved}`, xóa có `confirm`); Đánh giá `AC-M10` (`/courses/[slug]/write-review`: tạo, sửa, rút bằng `DELETE /reviews/{id}`, chặn sửa khi đánh giá bị Admin ẩn `AC-30`). |
| **`M-M05`** | **Tài khoản & Chứng chỉ** | Hồ sơ cá nhân (`PATCH /me`, họ tên trống/quá 100 ký tự `UC-G09`), đổi mật khẩu (`PUT /me/password`, sai mật khẩu hiện tại, trùng cũ, chính sách mật khẩu), danh sách chứng chỉ `AC-M12..M13` (`GET /me/certificates`, tải PDF kèm Bearer + chia sẻ trên native, mở `verifyUrl` trên web, sao chép link). |
| **`M-M06`** | **Kênh Giảng viên & Payout** | Hiển thị tab theo `shouldShowInstructorTab` (`INSTRUCTOR` hoặc `hasEarnings`); 5 phân mục `AC-M14..M18`: Tổng quan (biểu đồ 30 ngày, nhãn "Doanh số bán" / "Thu nhập thực nhận"), Khóa học + danh sách học viên (`UC-I19` không lộ email) + lời mời đồng GV (`UC-I14`, `UC-I15` có `confirm`), Hỏi đáp GV (`UC-I21`), Thu nhập `BR-PAY-HOLD` (`holdDays=0`, `holdDays>0`, `nextMaturityAt`, lọc bút toán `/instructor/entries`), Tài khoản nhận tiền (`currentPassword`, xóa ô mật khẩu sau submit, chỉ 4 số cuối) & Rút tiền (min `1.000.000`, tối đa `1 lần/tháng`, 4 mã lỗi, hủy khi `requested`, chống double-submit). |
| **`M-M07`** | **Quảng cáo Hybrid (`Q-M01`)** | `AdBanner` + `useInterstitialAd` dùng Google `TestIds`; House Ads (`PromotedCoursesBanner`, `CoursePromoModal`, `InlineSponsoredAd` loại trừ khóa đã sở hữu); **tuyệt đối không xuất hiện trong `app/learn/**`**; suy giảm êm (graceful degradation) trên Web, Expo Go, Jest. |
| **`M-M08`** | **Nền tảng chung & `BR-MOBILE-SCOPE`** | Banner offline + nút "Thử lại" (`expo-network` / `onlineManager`); `useForegroundSync` & `useRefetchOnScreenFocus`; chuẩn hóa lỗi v2 `parseAppError` (`message` tiếng Việt, `fieldErrors`, `429 Retry-After`, `traceId`); trạng thái `Loading / Empty / Error / Content` trên các màn hình; kiểm chứng 0 lệnh gọi `/cart`, `/orders`, `/payments`, `/webhooks`, `/auth/login` (cookie); mở web qua `expo-web-browser`. |
| **`M-API`** | **Kiểm thử Hợp đồng API (Contract)** | Đối chiếu toàn bộ 31 endpoint Mobile mà ứng dụng gọi với `docs/ai/api-contract-v2.md` và schema `docs/ai/openapi.json` (envelope `{success, message, data, errors}`, kiểu dữ liệu, trường bắt buộc, phân trang `Page<T>`). |
| **`M-REG`** | **Hồi quy (Regression)** | Hồi quy `SortPicker` bottom sheet và toàn bộ bộ kiểm thử bắt buộc trong `.agents/rules/60-testing.md`. |

### 2.2. Ngoài Phạm vi (Out of Scope)
- Giao diện thanh toán, giỏ hàng, lịch sử đơn hàng, biên soạn giáo trình/upload media trên ứng dụng di động (đã bị cấm theo `BR-MOBILE-SCOPE`).
- Sửa đổi mã nguồn Backend hoặc Web SPA trong quá trình kiểm thử Mobile (mọi lỗi phía server được ghi nhận với nhãn `[Backend]`).
- Phát hành lên Apple App Store / Google Play Store, thông báo đẩy (Push Notifications), tải video ngoại tuyến (Offline video download), In-App Purchase.

---

## 3. Quy tắc Trung thực, An toàn & Bảo mật (Honesty & Safety Rules)

1. **100% Trung thực**: Mọi kết quả `Pass` / `Fail` phải xuất phát từ lần chạy thật và có bằng chứng lưu tại `docs/testing/evidence/<RUN-ID>_*`. Nền tảng không có sẵn trên máy host (iOS Simulator trên Windows, hoặc Android Emulator nếu máy chưa cài Android SDK/AVD) bắt buộc ghi **`Blocked`** kèm lý do kỹ thuật rõ ràng — tuyệt đối không giả lập kết quả.
2. **Không sửa code trong chu kỳ thực thi**: Trong chu kỳ kiểm thử C1 không tự ý sửa code ứng dụng hay backend, không skip/xóa/nới lỏng bất kỳ test nào (`60-testing.md`).
3. **Bảo mật thông tin nhạy cảm (`MASVS-STORAGE` / `MASVS-CODE`)**: Tuyệt đối không ghi mật khẩu thật, JWT access token, refresh token hoặc số tài khoản ngân hàng đầy đủ (chỉ hiển thị 4 số cuối `•••• 1234`) vào tài liệu, log hay tệp bằng chứng (che bằng `***`).
4. **An toàn tài chính & Quảng cáo**: Không sử dụng tiền thật; quảng cáo AdMob chỉ dùng Google `TestIds`.

---

## 4. Sổ đăng ký Rủi ro (Risk Register)

| Mã Rủi ro | Loại | Module | Mô tả rủi ro | Khả năng | Tác động | Mức độ | Biện pháp kiểm soát trong kiểm thử |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **RSK-M-01** | Project | Toàn dự án | Thiếu tài liệu gốc `docs/requirements/EDU-MOB-SRS-001.md` và `EDU-MTP-001_Master_Test_Plan.md` trong repo | High | Medium | **High** | Báo cáo rõ cho Stakeholder; lập `requirements_inventory.csv` và RTM truy vết 100% sang `ac-checklist.md`, `.agents/rules/10..60`, `api-contract-v2.md` và các UC/BR/NFR kênh Mobile của `EDU-SRS-001 v3.0`. |
| **RSK-M-02** | Environment | COMP, E2E | Máy host chạy Windows không thể chạy iOS Simulator; Android Emulator có thể chưa được cài đặt hoặc thiếu cấu hình AVD API 30 / API 34 | High | High | **High** | Kiểm tra thực tế `adb`/`emulator` trên máy; thực thi đầy đủ trên các nền tảng khả dụng (`Jest`, `Node Contract/Perf`, `Expo Web Chrome DevTools`) và đánh dấu trung thực `Blocked` cho nền tảng phần cứng không hiện diện. |
| **RSK-M-03** | Technical | Backend chung | Dùng chung stack Backend `edumy-test` với đợt kiểm thử Web có thể gây lệch trạng thái dữ liệu (đơn rút tiền, tiến độ, đánh giá) | Medium | High | **High** | Không chạy song song với test Web; khôi phục/seed dữ liệu chuẩn trước mỗi chu kỳ; ghi rõ commit cả `Edumy-App` và `Edumy-main`. |
| **RSK-M-04** | Technical | M-M07 (Ads) | Module native `react-native-google-mobile-ads` không chạy trong Expo Go, Jest hoặc trình duyệt Web và dễ gây crash nếu thiếu adapter | High | High | **High** | Kiểm thử kỹ cơ chế suy giảm êm (`src/lib/ads.ts` & `src/lib/ads.web.ts`) trên Jest và Web, đồng thời kiểm tra guardrail `0` quảng cáo trong `app/learn/**`. |
| **RSK-M-05** | Product (Auth) | M-M01, SEC | Race condition khi nhiều request gặp `401` cùng lúc hoặc người dùng bấm Đăng xuất giữa lúc request `/auth/mobile/refresh` đang bay (`sessionEpoch`) | Medium | High | **Critical** | Kiểm thử đơn vị & tích hợp với `axios-mock-adapter` cho single-flight refresh, `sessionEpoch` guard, token rotation/reuse và lưu trữ token theo nền tảng (`SecureStore` vs memory). |
| **RSK-M-06** | Product (Scope) | M-M02, M-M08 | Vi phạm `BR-MOBILE-SCOPE`: rò rỉ màn hình hoặc lệnh gọi API `/cart`, `/orders`, `/payments`, `/webhooks` hoặc `/auth/login` (cookie) | Low | High | **Critical** | Quét tĩnh mã nguồn + giám sát toàn bộ network log trong phiên E2E + kiểm thử 5 nhánh `resolveCourseAction`. |
| **RSK-M-07** | Product (Payout) | M-M06 | Lệch quy tắc `BR-PAY-HOLD` (`holdDays`, `nextMaturityAt`), lộ số tài khoản ngân hàng đầy đủ/mật khẩu hiện tại, hoặc cho phép rút tiền < 1.000.000đ / > 1 lần/tháng / double-submit | Medium | High | **Critical** | Kiểm thử BVA & Decision Table cho `validateWithdrawalAmount`, `formatHoldDaysExplanation`, `resolveWithdrawalErrorAction`, `maskAccountNumber` và gọi thật API rút tiền trên backend `edumy-test`. |
| **RSK-M-08** | Product (Contract) | M-API | Sai lệch cấu trúc JSON giữa `openapi.json`, `api-contract-v2.md` và phản hồi thực tế của Backend `/api/v1/*` (vd. cấu trúc `Page<T>`, trường `isResolved`, `holdDays`) | Medium | High | **High** | Xây dựng script kiểm thử hợp đồng `M-API` gọi thật toàn bộ endpoint trên `edumy-test` và đối chiếu schema. |

---

## 5. Chiến lược, Cấp độ & Công cụ Kiểm thử

### 5.1. Cấp độ Kiểm thử (Test Levels)
1. **Unit Testing (Logic thuần)**: Kiểm thử toàn bộ hàm thuần trong `src/features/*/logic.ts`, `src/lib/{money,date,web-links,dialog}.ts`, `src/api/{envelope,problem,tokens}.ts`.
2. **Component & Hook Integration Testing**: Sử dụng `jest-expo`, `@testing-library/react-native` và `axios-mock-adapter` kiểm thử `client.ts` (single-flight refresh, `sessionEpoch`), `useRestoreSession`, `useLogout`, `SortPicker`, các màn hình và trạng thái `Loading / Empty / Error / Content`.
3. **API Contract Testing (`M-API`)**: Script Node.js + `ajv` (đã có sẵn trong `devDependencies` của `package.json`) đối chiếu phản hồi thực tế từ Backend `edumy-test` (`http://localhost:5001/api/v1`) với `docs/ai/api-contract-v2.md` và `docs/ai/openapi.json`.
4. **System / E2E & Acceptance Testing (`AC-M01..AC-M18`, `BR-MOBILE-SCOPE`)**: Thực thi ứng dụng kết nối Backend `edumy-test` thật trên Web (`npx expo start --web` qua Chrome DevTools browser agent) và Android Emulator (nếu máy host có SDK/AVD; nếu không có ghi nhận `Blocked` trung thực).

### 5.2. Công cụ Sử dụng (Không cài thêm package mới vào dự án)
- **Kiểm tra tĩnh**: `npx tsc --noEmit` (TypeScript strict), `npm run lint` (`eslint . --max-warnings=0`) + script kiểm tra quy tắc kiến trúc (0 `Alert.alert` ngoài `dialog.ts`, 0 component gọi trực tiếp `axios`/`client`, 0 `/cart` hay `/orders`).
- **Unit / Component / Integration**: `npm test -- --coverage` (`jest-expo` + `@testing-library/react-native` + `axios-mock-adapter`).
- **Contract & Hiệu năng API**: Script Node.js thuần trong `docs/testing/scripts/` (sử dụng `fetch` và `ajv` sẵn có).
- **E2E UI**: Antigravity Chrome DevTools Browser Subagent trên `npx expo start --web` (viewport mobile `360x800` & desktop) + Android Emulator (nếu có).
- **Sinh sổ Excel & Biểu đồ**: Python + `openpyxl` + `matplotlib` trên môi trường ảo độc lập (ngoài repo).

---

## 6. Tiêu chí Bắt đầu, Kết thúc, Tạm dừng & Tiếp tục

- **Tiêu chí Bắt đầu (Entry Criteria)**:
  1. `npx tsc --noEmit` đạt `0` lỗi; `npm run lint` đạt `0` lỗi / `0` cảnh báo.
  2. Bộ test Jest hiện có chạy thông suốt (`npm test`).
  3. Stack Backend `edumy-test` hoạt động healthy (`http://localhost:5001/api/v1`) với dữ liệu seed chuẩn.
  4. Kế hoạch `EDU-TP-M-001` và bộ Test Case `EDU-TCS-M-001` (Pha 2) được hoàn tất và kiểm tra độ phủ 100%.
- **Tiêu chí Kết thúc (Exit Criteria)**:
  1. `100%` yêu cầu trong `requirements_inventory.csv` có Test Case truy vết trên RTM (`0` khoảng trống).
  2. `100%` Test Case được xử lý (`0 Not Run`; mọi TC `Blocked` do thiếu phần cứng iOS/Android Emulator có lý do rõ ràng).
  3. Pass rate trên tập Test Case thực thi được đạt **`>= 95%`**.
  4. **`0`** Defect mức `S1 Critical` hoặc `S2 Major` thuộc nhãn `[App]` còn mở; mọi Defect `[Backend]` (nếu có) có đầy đủ bằng chứng request/response.
  5. `100%` tiêu chí nghiệm thu trong `docs/ai/ac-checklist.md` (`BR-MOBILE-SCOPE`, `AC-M01..AC-M18`) có Test Case đạt `Pass`.
- **Tiêu chí Tạm dừng (Suspension Criteria)**: Backend `edumy-test` ngừng hoạt động hoặc phát hiện lỗi `S1` làm sập luồng đăng nhập/khôi phục phiên.
- **Tiêu chí Tiếp tục (Resumption Criteria)**: Khắc phục sự cố và vượt qua bộ **Smoke Test 8 TC High** (Đăng nhập, Khám phá, Chi tiết khóa học, Ghi danh miễn phí, Bài học, Chứng chỉ, Tab Giảng viên, Đăng xuất).

---

## 7. Lịch trình 6 Pha & Sản phẩm bàn giao (Deliverables)

| Pha | Nội dung công việc | Sản phẩm bàn giao (`Edumy-App/docs/testing/`) | Cổng kiểm soát |
| :---: | :--- | :--- | :--- |
| **Pha 1** | Lập Kế hoạch kiểm thử hệ thống Mobile | `EDU-TP-M-001_Test_Plan.md` | Báo cáo thiếu `EDU-MOB-SRS-001.md` |
| **Pha 2** | Trích xuất Yêu cầu, Thiết kế Test, Sinh Test Cases & RTM | `requirements_inventory.csv`, `EDU-TDS-M-001_Test_Design.md`, `EDU-TCS-M-001_Test_Cases.xlsx` (8 sheets) | **`>>> DỪNG cuối Pha 2`**: Gửi bảng thống kê TC & chờ duyệt |
| **Pha 3** | Thiết lập Môi trường & Chạy Smoke Test | `EDU-TER-M-001_Test_Environment.md`, bằng chứng Smoke Test | 8/8 Smoke TC khả dụng đạt |
| **Pha 4** | Thực thi Chu kỳ C1 (`M-M01`..`M-M08`, `M-API`, `M-REG`, NFR) | `EDU-TEL-M-001_Execution_Log.csv`, `EDU-TIR-M-001_Defect_Report.md`, `EDU-TSR-M-001_Status_Report.md`, `PROGRESS.md`, `evidence/` | **`>>> DỪNG cuối C1`**: Gửi `EDU-TSR-M-001` |
| **Pha 5** | Khắc phục lỗi (nếu được duyệt) & Thực thi Chu kỳ C2 / C3 | Cập nhật `EDU-TEL-M-001`, `EDU-TIR-M-001`, `EDU-TSR-M-002` | Đóng toàn bộ S1/S2 `[App]` |
| **Pha 6** | Báo cáo Hoàn tất kiểm thử & Cập nhật `ac-checklist.md` | `EDU-TCR-M-001_Test_Completion_Report.md` (10 bảng + 4 biểu đồ PNG), cập nhật `docs/ai/ac-checklist.md` & `docs/ai/progress.md` | Commit `test(qa-mobile): ...` |
