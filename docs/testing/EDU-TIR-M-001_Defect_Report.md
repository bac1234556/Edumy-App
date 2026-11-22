# EDU-TIR-M-001 — BÁO CÁO LỖI HỆ THỐNG EDUMY MOBILE (TEST INCIDENT / DEFECT REPORT)

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Mã tài liệu** | `EDU-TIR-M-001` |
| **Chu kỳ kiểm thử** | `C1` (`Edumy-App@6cf1e9e` / `Edumy-main@260de6b`) |
| **Thời điểm** | `2026-11-22` (Asia/Ho_Chi_Minh) |
| **Tổng số Defect phát hiện** | **4** (`0 S1`, `3 S2`, `0 S3`, `1 S4` — Liên quan `[App]`: 2 · Chỉ `[Backend]`: 2) |

## 1. Bảng Tổng hợp Defect Chu kỳ C1

| Mã Defect | Nhãn | Module | Severity | Priority | Trạng thái | TC phát hiện | Run ID | Tóm tắt lỗi |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :--- |
| **DEF-M-001** | `[Backend]` | `M-API` | **S4** | `P3` | **Closed** | `TC-M-M06-FN-009, TC-M-API-FN-007` | `RUN-M-C1-0021` | PUT /api/v1/me/payout-account khi sai mật khẩu hiện tại trả errors.code='PASSWORD_INCORRECT' (422) thay vì 'CURRENT_PASSWORD_INCORRECT' như ghi trong api-contract-v2.md §2.6 |
| **DEF-M-002** | `[Backend]` | `M-M04` | **S2** | `P1` | **Closed** | `TC-M-M04-FN-004` | `RUN-M-C1-0062` | POST /api/v1/questions/{questionId}/resolve cho phép học viên khác (không phải người hỏi, không phải giảng viên khóa học) đánh dấu đã giải quyết câu hỏi (HTTP 200 thay vì 403 FORBIDDEN) |
| **DEF-M-003** | `[App]` | `M-M04` | **S2** | `P1` | **Closed** | `TC-M-M04-FN-005, TC-M-M04-FN-006` | `RUN-M-C1-0064` | Edumy-App chưa hỗ trợ PUT /api/v1/reviews/{reviewId} để cập nhật đánh giá đã gửi và xử lý mã lỗi đánh giá bị Admin ẩn chưa khớp với Backend (write-review.tsx chỉ gọi POST /courses/{id}/reviews gây lỗi 400 BAD_REQUEST) |
| **DEF-M-004** | `[App] [Backend]` | `M-M06` | **S2** | `P1` | **Closed** | `TC-M-M06-FN-003, TC-M-API-FN-006` | `RUN-M-C1-0069` | Lộ địa chỉ email học viên trong danh sách học viên của giảng viên: GET /api/v1/instructor/courses/{courseId}/students trả trường email và màn hình students.tsx hiển thị trực tiếp email học viên (vi phạm UC-I19 & AC-M15) |

## 2. Chi tiết từng Defect

### DEF-M-001 — PUT /api/v1/me/payout-account khi sai mật khẩu hiện tại trả errors.code='PASSWORD_INCORRECT' (422) thay vì 'CURRENT_PASSWORD_INCORRECT' như ghi trong api-contract-v2.md §2.6
- **Nhãn trách nhiệm**: `[Backend]`
- **Module / Loại**: `M-API` / `Contract`
- **Severity / Priority**: **S4** / `P3`
- **Trạng thái**: **Closed** (Chu kỳ phát hiện: `C1`)
- **Truy vết Yêu cầu & Test Case**: `API-29, AC-M18, RULE-BIZ-04` → `TC-M-M06-FN-009, TC-M-API-FN-007` (`RUN-M-C1-0021`)
- **Build phát hiện**: `Edumy-App@6cf1e9e / Edumy-main@260de6b`
- **Các bước tái hiện**:
  1. Đăng nhập tài khoản giảng viên (qa.gva@edumy.test).
2. Gọi PUT /api/v1/me/payout-account với currentPassword sai ('***').
- **Kết quả kỳ vọng (Expected)**:
  HTTP 422 với errors.code = 'CURRENT_PASSWORD_INCORRECT' theo docs/ai/api-contract-v2.md mục 2.6.
- **Kết quả thực tế (Actual)**:
  Ở C1: Backend (PayoutAccountServiceImpl.java dòng 42) trả HTTP 422 với errors.code = 'PASSWORD_INCORRECT'.
Khắc phục ở C2: Đã sửa PayoutAccountServiceImpl.java dòng 42 trả đúng mã lỗi 'CURRENT_PASSWORD_INCORRECT' chuẩn api-contract-v2.md §2.6.
- **Bằng chứng**: `evidence/RUN-M-C1-0021_TC-M-M06-FN-009.json`
- **Ghi chú**: Đã sửa trên Backend (PayoutAccountServiceImpl.java) và đóng (Closed) ở Chu kỳ C2.

### DEF-M-002 — POST /api/v1/questions/{questionId}/resolve cho phép học viên khác (không phải người hỏi, không phải giảng viên khóa học) đánh dấu đã giải quyết câu hỏi (HTTP 200 thay vì 403 FORBIDDEN)
- **Nhãn trách nhiệm**: `[Backend]`
- **Module / Loại**: `M-M04` / `Security`
- **Severity / Priority**: **S2** / `P1`
- **Trạng thái**: **Closed** (Chu kỳ phát hiện: `C1`)
- **Truy vết Yêu cầu & Test Case**: `AC-M08, UC-S12, API-23, MASVS-AUTH-2` → `TC-M-M04-FN-004` (`RUN-M-C1-0062`)
- **Build phát hiện**: `Edumy-App@6cf1e9e / Edumy-main@260de6b`
- **Các bước tái hiện**:
  1. Học viên HV1 (qa.hv1@edumy.test) tạo câu hỏi mới POST /api/v1/courses/47/questions -> nhận questionId.
2. Học viên HV2 (qa.hv2@edumy.test — không phải tác giả câu hỏi và không phải giảng viên khóa học) gọi POST /api/v1/questions/{questionId}/resolve với body {"resolved": true}.
- **Kết quả kỳ vọng (Expected)**:
  Backend trả HTTP 403 FORBIDDEN (chỉ tác giả câu hỏi hoặc giảng viên sở hữu/đồng giảng khóa học mới được đánh dấu đã giải quyết theo UC-S12 & AC-M08).
- **Kết quả thực tế (Actual)**:
  Ở C1: Backend (QaService.setResolved) thiếu kiểm tra quyền tác giả câu hỏi hoặc giảng viên/Admin nên trả HTTP 200.
Khắc phục ở C2: Đã bổ sung kiểm tra isCourseInstructorOrAdmin || isQuestionAsker trong QaService.setResolved (ném BusinessException(ErrorCode.FORBIDDEN) khi không đủ quyền). Kiểm thử lại RUN-M-C2-0004 đạt PASS (HTTP 403 FORBIDDEN).
- **Bằng chứng**: `evidence/RUN-M-C2-0004_TC-M-M04-FN-004.json`
- **Ghi chú**: Đã sửa trên Backend (QaService.java) và đóng (Closed) ở Chu kỳ C2.

### DEF-M-003 — Edumy-App chưa hỗ trợ PUT /api/v1/reviews/{reviewId} để cập nhật đánh giá đã gửi và xử lý mã lỗi đánh giá bị Admin ẩn chưa khớp với Backend (write-review.tsx chỉ gọi POST /courses/{id}/reviews gây lỗi 400 BAD_REQUEST)
- **Nhãn trách nhiệm**: `[App]`
- **Module / Loại**: `M-M04` / `Functional`
- **Severity / Priority**: **S2** / `P1`
- **Trạng thái**: **Closed** (Chu kỳ phát hiện: `C1`)
- **Truy vết Yêu cầu & Test Case**: `AC-M09, UC-S14, AC-30, API-24` → `TC-M-M04-FN-005, TC-M-M04-FN-006` (`RUN-M-C1-0064`)
- **Build phát hiện**: `Edumy-App@6cf1e9e`
- **Các bước tái hiện**:
  1. Học viên HV1 đã gửi đánh giá (rating=5) cho khóa học.
2. Mở lại màn hình Viết/Sửa đánh giá (app/courses/[slug]/write-review.tsx) hoặc khi đánh giá đó bị Admin ẩn (POST /api/v1/admin/reviews/{id}/hide) rồi bấm Gửi đánh giá.
- **Kết quả kỳ vọng (Expected)**:
  1. Khi học viên đã có đánh giá trước đó, ứng dụng gọi PUT /api/v1/reviews/{reviewId} để cập nhật đánh giá (HTTP 204) và hỗ trợ rút đánh giá (DELETE /api/v1/reviews/{reviewId}).
2. Khi đánh giá đã bị Admin ẩn (AC-30), ứng dụng nhận diện đúng phản hồi 403/409/400 từ Backend và hiển thị thông báo đánh giá đã bị Quản trị viên ẩn.
- **Kết quả thực tế (Actual)**:
  Ở C1: src/features/reviews/api.ts chỉ có submitReviewApi (POST) và deleteReviewApi, thiếu updateReviewApi (PUT /reviews/{id}); write-review.tsx chỉ kiểm tra REVIEW_HIDDEN_BY_ADMIN || 409.
Khắc phục ở C2: Đã bổ sung updateReviewApi (PUT /reviews/{id}), hook useUpdateReview, hàm isReviewHiddenError (kèm unit test mới trong src/features/reviews/__tests__/logic.test.ts) và cập nhật write-review.tsx nạp đánh giá hiện có để sửa/rút hoặc báo lỗi bị Admin ẩn. Kiểm thử lại RUN-M-C2-0001 & RUN-M-C2-0002 đạt PASS 100%.
- **Bằng chứng**: `evidence/RUN-M-C2-0001_TC-M-M04-FN-005.json`
- **Ghi chú**: Đã sửa và đóng (Closed) ở Chu kỳ C2.

### DEF-M-004 — Lộ địa chỉ email học viên trong danh sách học viên của giảng viên: GET /api/v1/instructor/courses/{courseId}/students trả trường email và màn hình students.tsx hiển thị trực tiếp email học viên (vi phạm UC-I19 & AC-M15)
- **Nhãn trách nhiệm**: `[App] [Backend]`
- **Module / Loại**: `M-M06` / `Privacy/Security`
- **Severity / Priority**: **S2** / `P1`
- **Trạng thái**: **Closed** (Chu kỳ phát hiện: `C1`)
- **Truy vết Yêu cầu & Test Case**: `AC-M15, UC-I19, API-26, MASVS-PRIVACY` → `TC-M-M06-FN-003, TC-M-API-FN-006` (`RUN-M-C1-0069`)
- **Build phát hiện**: `Edumy-App@6cf1e9e / Edumy-main@260de6b`
- **Các bước tái hiện**:
  1. Đăng nhập tài khoản giảng viên (qa.gva@edumy.test).
2. Mở tab Giảng viên -> Khóa học của tôi -> chọn khóa học 49 -> xem Danh sách học viên (app/instructor/courses/[courseId]/students.tsx) hoặc gọi GET /api/v1/instructor/courses/49/students.
- **Kết quả kỳ vọng (Expected)**:
  Theo UC-I19 và AC-M15, API và giao diện danh sách học viên của giảng viên chỉ hiển thị Họ tên, Ngày ghi danh và Tiến độ (%), tuyệt đối không trả hoặc hiển thị email học viên.
- **Kết quả thực tế (Actual)**:
  Ở C1: Backend trả trường email trong StudentRosterItemDto và students.tsx dòng 73 render trực tiếp item.email.
Khắc phục ở C2 (cả [App] và [Backend]):
- [Backend] Đã gỡ trường email khỏi StudentRosterItemDto trong InstructorChannelController.java và InstructorController.java.
- [App] Đã gỡ dòng hiển thị item.email khỏi app/instructor/courses/[courseId]/students.tsx và xóa trường email tại getInstructorCourseStudentsApi.
Kiểm thử lại RUN-M-C2-0003 (TC-M-M06-FN-003) & RUN-M-C2-0005 (TC-M-API-FN-006) đều đạt PASS 100%.
- **Bằng chứng**: `evidence/RUN-M-C2-0003_TC-M-M06-FN-003.json`
- **Ghi chú**: Đã khắc phục triệt để trên cả [App] lẫn [Backend] và đóng (Closed) ở Chu kỳ C2.
