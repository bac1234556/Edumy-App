# B01 — Endpoint đăng nhập cho mobile (identity)

**Phụ thuộc:** B00 đã được duyệt. Dùng plan mode (đụng `identity`).

**Việc cần làm** theo ADR-015:
1. Thêm `POST /api/v1/auth/mobile/register|login|refresh|logout`. Trả `{accessToken, expiresAt, refreshToken, refreshExpiresAt}`
   (logout 204). Refresh và logout nhận `{refreshToken}` trong body; không cookie, không kiểm `Origin`.
2. Dùng lại `AuthService` / `SessionService` (không nhân bản logic): cùng họ refresh token, cùng xoay vòng, cùng phát hiện
   dùng lại (commit thu hồi trước khi trả 401), cùng `LoginAttemptLimiter`, cùng giới hạn theo IP của register.
3. `SecurityConfig`: cho phép công khai các đường dẫn mới; Bearer header gửi kèm bị bỏ qua như các `/auth/**` khác.
4. Không bao giờ log refresh token; `toString` của DTO che token (giống `AuthTokenResponse`).
5. Cập nhật `docs/ai/05-api-contract.md`, `04-security.md`.

**Test bắt buộc:** đăng ký/đăng nhập trả cả hai token; refresh xoay vòng và token cũ bị từ chối; dùng lại token cũ thu hồi
cả họ; logout bằng refresh token khi access đã hết hạn; khóa tài khoản làm refresh thất bại; endpoint web cũ không đổi
hành vi; `ModularityTest` xanh. Chạy `./mvnw test` và dán dòng tổng kết.
