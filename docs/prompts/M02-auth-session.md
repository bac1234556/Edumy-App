# M02 — Đăng nhập, đăng ký, phiên và đăng xuất

**Phụ thuộc:** M01; backend **B01 đã xong** (`/auth/mobile/*` có trong OpenAPI). Nếu chưa → DỪNG.

**Đọc trước:** `.agents/rules/30-auth-security.md` (toàn bộ), rules 20, đặc tả mục 2.2 và 4.6, AC-M03, AC-M04.

**Việc cần làm**
1. `features/auth`: `api.ts` (mobile register/login/refresh/logout, forgot password, resend verification),
   `hooks.ts`, `logic.ts` (zod schema mật khẩu 8–72 ký tự, có chữ và số).
2. Khởi động app: khôi phục phiên theo luồng 1 của rules 30; màn chờ trong lúc `status = unknown`.
3. Màn `(auth)/login`, `(auth)/register`, `(auth)/forgot-password` với thông báo lỗi theo bảng mã lỗi của rules 20
   (sai thông tin, tài khoản khóa, bị chặn tạm thời có đếm ngược, email đã đăng ký).
4. Đăng xuất theo luồng 3 (luôn xóa token và cache dù server lỗi). Phiên bị kết thúc từ nơi khác theo luồng 4.
5. Guard điều hướng: chưa đăng nhập thì vẫn xem được Khám phá; các tab cần đăng nhập đưa về màn đăng nhập.

**Không được:** dùng endpoint cookie `/auth/login…`; lưu token ngoài secure-store; ghi log body của các request auth.

**Xong khi:** đăng ký → vào app ngay; đăng nhập/đăng xuất chạy với backend thật; đổi mật khẩu trên web làm app về
màn đăng nhập ở lần làm mới kế tiếp (AC-M03, thử thủ công); test cho schema mật khẩu và luồng khôi phục phiên.
