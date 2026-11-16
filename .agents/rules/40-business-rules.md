---
trigger: model_decision
description: "Edumy business rules for the app: course page actions, cart without checkout, orders, learning, Q&A, reviews, certificates, instructor earnings and withdrawals. Apply whenever implementing or reviewing any feature screen or its logic."
---

# 40 — Business rules the app must respect (from EDU-MOB-SRS-001)

Full spec: @docs/requirements/EDU-MOB-SRS-001.md. The server enforces every rule; the app must show the
right action, never offer a forbidden one, and explain refusals with the server message.

## Course page action — D-M02 (implement as a pure function `resolveCourseAction` in `features/catalog/logic.ts`)
Input: `isLoggedIn`, `detail.isFree`, `detail.viewer {owned,inCart,isInstructor}` (null when anonymous).
Evaluate top-down, first match wins:
| # | Condition | Primary action | Secondary / notice |
|---|---|---|---|
| 1 | not logged in | "Đăng nhập để học" | paid course: "Khóa học trả phí được mua trên website" |
| 2 | `isInstructor` | none | "Bạn là giảng viên của khóa này"; may open content read-only (no progress, D-32) |
| 3 | `owned` | "Vào học" | — |
| 4 | `isFree` | "Ghi danh miễn phí" (`POST /courses/{id}/enrollments`, 201 or 200 → open learning) | — |
| 5 | paid & `inCart` | "Đã có trong giỏ" (open cart) | "Mua trên website" |
| 6 | paid & not in cart | "Thêm vào giỏ" | "Mua trên website" + notice "Khóa học này được thanh toán trên website" |
Hidden courses are only visible to owners/instructors; otherwise the server answers 404 → "Không tìm thấy khóa học".

## Cart without checkout — BR-M01
- Add/remove like the web (UC-S01, UC-S03). Show each line with current price; non-purchasable lines show the reason:
  `course_unavailable` "Khóa học không còn được bán" · `already_owned` "Bạn đã sở hữu khóa học này" ·
  `own_course` "Bạn là giảng viên của khóa học này" · `now_free` "Khóa học đã miễn phí" + "Ghi danh ngay".
- Total = server `totalAmount` (purchasable lines only). **No checkout button.** Footer text:
  "Vui lòng truy cập website để tiến hành thanh toán" + button "Mở website" (`webLinks.cart()`).

## Orders (read-only)
List newest first; detail shows lines with locked prices. `pending` order: notice "Đơn đang chờ thanh toán" +
"Tiếp tục trên website" (`webLinks.order(orderCode)`). No QR, no cancel. Refetch My learning + Cart on app focus.

## Learning
- My learning includes hidden courses (BR-31); shows % progress, "Học tiếp" (last accessed lesson), certificate badge.
- Opening a lesson → `POST /learn/lessons/{id}/visit` once per open (D-34).
- Video: URL ending in `.mp4`/`.m3u8` (ignoring query string) → expo-video; anything else → WebView. Article: plain text.
- Completion is **manual** (toggle, D-33). Never auto-complete at video end. On `certificateIssued: true` show a
  congratulation and a link to Certificates. Progress % comes from the server, never computed in the app.

## Q&A, reviews, certificates
- Question: title ≤200, content ≤5000, optional lesson of the same course. Thread: asker may reply; edit/delete own;
  resolve/unresolve own (`POST /questions/{id}/resolve {resolved}`). Hidden by admin → read-only.
- Review: rating 1–5, comment ≤2000. Posting again updates the existing review (AC-14). Withdraw = DELETE.
- Certificates: list, download PDF, share, copy verification link `webLinks.certificate(code)`.

## Instructor money mode (phân hệ 06)
- **Tab visibility (D-M01):** `me.roles` contains `instructor` OR `GET /me/earnings/summary` has `hasEarnings: true`.
  A revoked instructor with earnings still sees it (BR-53).
- The app only **displays** server amounts: total, pending (chờ đáo hạn), in withdrawal, withdrawn, available.
  Never compute shares, fees or maturity in the app (BR-42…BR-50 are server rules).
- Explain maturity: earnings of month M become available on 01/M+1 (Vietnam time). In demo mode the server may
  report `maturityPolicy: "immediate"` → show "Chế độ demo: thu nhập khả dụng ngay".
- Payout account (BR-52, BR-54): bank name, account number, holder name; create/edit requires the current password;
  show only the last 4 digits.
- Withdrawal (UC-I27, BR-51): integer VND, ≥ `minWithdrawal` (100.000 đ) and ≤ available; one open request at a time;
  client-side checks are UX only — always handle the server errors E1–E4. Cancel allowed while `requested`.
- Statuses: `requested` "Đang chờ xử lý" · `paid` "Đã chuyển khoản" (show `transferReference`) ·
  `rejected` "Bị từ chối" (show reason) · `cancelled` "Đã hủy".
- Revenue-share percentages are edited on the website by the main instructor, never in the app.

## Ads
BLOCKED until Q-M01 is decided. Do not implement anything about ads.
