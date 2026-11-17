---
trigger: model_decision
description: "Edumy business rules for the app: scope, course actions, learning, Q&A, reviews, certificates, instructor channel, BR-PAY-HOLD, and withdrawals."
---

# 40 — Business rules (v2)

## BR-MOBILE-SCOPE — App = Học tập + Kênh giảng viên
- **No cart, no order history, no payment/checkout** anywhere in the app. Never call `/cart/**` or `/orders/**`.
- Web handles all purchasing. Paid courses open `${WEB_BASE_URL}/courses/{id}` via `expo-web-browser`.
- Instructor tab supports viewing and light actions only (overview, courses, students, Q&A, invitations, earnings, payout account, withdrawals). No course authoring, upload, or lesson ordering.

## Course page action (`resolveCourseAction` in `src/features/catalog/logic.ts`)
Inputs: `isLoggedIn`, `detail.isFree`, `detail.viewer {owned, isInstructor}` (null when anonymous), `lastAccessedLessonId` (when owned).
Evaluate top-down:
1. `viewer?.isInstructor` → notice **"Bạn là giảng viên khóa này"** (no purchase/enroll CTA).
2. `viewer?.owned` → primary **"Vào học"** (or **"Học tiếp"** if `lastAccessedLessonId` exists).
3. `isFree`:
   - logged in → **"Ghi danh miễn phí"** (`POST /courses/{id}/enrollments` → invalidate `['learning']`, `['catalog', 'course', slug]` → open learning room).
   - not logged in → **"Đăng nhập để ghi danh"**.
4. Paid & not owned (logged in or anonymous) → **"Mua trên website"** (opens `${WEB_BASE_URL}/courses/${id}`).
Hidden courses return 404 to non-owners/non-instructors → "Không tìm thấy khóa học".

## Learning & Certificates
- My learning (`GET /me/enrollments`, paginated) shows server `progressPercent`, "Học tiếp" (`lastAccessedLessonId` or first uncompleted lesson).
- Learn room (`GET /learn/courses/{courseId}`) shows chapters, lessons, and quizzes (**"Bài kiểm tra — làm trên website"** linking to web). Server `progress.percent` includes quizzes so app % === web %.
- Lesson screen: call `POST /learn/lessons/{id}/visit` on open; Prev/Next buttons via `prevLessonId`/`nextLessonId`; manual completion toggle (`PUT /learn/lessons/{id}/completion`). On `certificateJustIssued: true`, show congratulation modal/screen with `certificateCode`. On `articleContent === null`, show "Nội dung bài đọc có trên website" + web button. On `403 NOT_ENROLLED`, return to course page with notification.
- Certificates (`GET /me/certificates`, paginated): download PDF via Bearer auth + share on native, open `verifyUrl` on web, copy `verifyUrl` from server.

## Q&A and Reviews
- Q&A uses v2 fields (`isResolved`, `askerId`, `askerName`, `hasInstructorAnswer`, `visibilityStatus`, `authorId`, `authorName`, `authorType`).
- `POST /questions/{id}/resolve` sends `{resolved}`.
- Review withdraw uses `DELETE /reviews/{id}`.

## Instructor channel & BR-PAY-HOLD
- **Tab visibility (`shouldShowInstructorTab`):** `me.roles` contains `INSTRUCTOR` (case-insensitive) OR `earnings.summary.hasEarnings === true`.
- **Money labels:** always label **"Doanh số bán"** = `grossSales` and **"Thu nhập thực nhận"** = `netEarnings` with note *"đã trừ 30% phí nền tảng và phần chia đồng giảng viên"*. Never compute percentages or amounts in the app.
- **BR-PAY-HOLD (rolling maturity):** each earning matures after `holdDays` days from order payment (`holdDays` comes from server `EarningSummaryDto.holdDays`, never hard-coded; remove all `maturityPolicy` copy/logic):
  - `holdDays === 0`: *"Thu nhập khả dụng ngay sau khi đơn hàng được thanh toán (chế độ demo)"*
  - `holdDays > 0`: *"Mỗi khoản thu nhập khả dụng sau {holdDays} ngày kể từ khi đơn hàng được thanh toán"*
  - If `nextMaturityAt` is present: *"Khoản tiếp theo khả dụng lúc {dd/MM/yyyy HH:mm}"*
- **Payout account:** `PUT /me/payout-account` requires `currentPassword`; clear password field after submit; display only last 4 digits; never log account numbers.
- **Withdrawals:** client checks (`>= minWithdrawal`, `<= availableBalance`, integer) are UX only — server decides. Disable submit while `isPending` (no double submit). Cancel allowed only while `status === 'requested'`, confirmed via `confirm`.
  Statuses: `requested` "Đang chờ duyệt" · `paid` "Đã chuyển khoản" (with `transferReference`) · `rejected` "Bị từ chối" (with `rejectReason`) · `cancelled` "Đã hủy".

## Ads
BLOCKED until Q-M01 is decided. Do not implement anything about ads.
