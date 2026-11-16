# B04 — Tài khoản nhận tiền, yêu cầu rút, admin xử lý

**Phụ thuộc:** B03. **Quy tắc:** BR-51…BR-56. **UC:** I26, I27, I28, A20.

**Việc cần làm**
1. `GET|PUT /me/payout-account` (PUT cần `currentPassword`, kiểm qua một API mới của `identity::api`, không đọc bảng `users`).
   Trả số tài khoản đã che (4 số cuối). Không bao giờ log số tài khoản.
2. `POST /me/withdrawals {amount}`: khóa theo giảng viên (dòng tài khoản nhận tiền `FOR UPDATE`), tính lại số dư khả dụng,
   kiểm ≥ `edumy.payout.min-withdrawal` (100.000), ≤ khả dụng, chưa có yêu cầu `requested`; chụp thông tin tài khoản vào yêu cầu.
   Mã lỗi: `WITHDRAWAL_BELOW_MINIMUM`, `WITHDRAWAL_EXCEEDS_BALANCE`, `PAYOUT_ACCOUNT_REQUIRED` (422), `WITHDRAWAL_ALREADY_OPEN` (409).
3. `GET /me/withdrawals`, `POST /me/withdrawals/{id}/cancel` (chỉ `requested`; của người khác → 404).
4. Admin web: `GET /admin/withdrawals?status=`, `POST /admin/withdrawals/{id}/pay {transferReference}`,
   `POST /admin/withdrawals/{id}/reject {reason}`; kiểm lại vai trò admin trong DB (BR-26), khóa dòng yêu cầu;
   hai admin cùng xử lý → người sau 409.
5. Thư "đã chi" và "bị từ chối" qua `notification` (event sau commit). Profile `demo` đặt `edumy.payout.maturity=immediate`.
6. Thêm hàng vào ma trận IDOR (`docs/ai/10-idor-coverage.md`) cho mọi endpoint mới.

**Test bắt buộc:** AC-M14, AC-M15 (hai yêu cầu đồng thời bằng `support/LockWaits` → đúng một được tạo), AC-M16, AC-M17;
IDOR; thư không chứa số tài khoản đầy đủ. Chạy `./mvnw test`.
