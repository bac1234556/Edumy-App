# B03 — Module `payout`: sổ thu nhập

**Phụ thuộc:** B02. **Dùng plan mode** (đụng `commerce` T2 và `db/migration`). **Quy tắc:** BR-42, BR-43, BR-47, BR-48, BR-49.

**Việc cần làm**
1. Tạo module `com.edumy.payout` đúng ADR-007 (`package-info` với `allowedDependencies = {"shared", "identity :: api",
   "authoring :: api"}`, `api/`, `service/`, `entity/`, `repository/`, …). Migration **V8**: bảng sổ thu nhập
   (UNIQUE theo dòng đơn × người nhận), tài khoản nhận tiền, yêu cầu rút (bảng dùng ở B04).
2. `payout::api.EarningApi.recordForPaidOrder(command)` — `@Transactional(propagation = MANDATORY)`; nhận order id, mã đơn,
   các dòng `{orderItemId, courseId, unitPrice}` **chỉ của khóa vừa được cấp ghi danh**, thời điểm thanh toán.
   Đọc tỷ lệ qua `authoring::api`, chụp phí 3.000 bps từ cấu hình `edumy.payout.platform-fee-bps`.
   Công thức (đặc tả 5.1): quỹ = floor(giá × (10.000 − phí) / 10.000); đồng GV = floor(quỹ × tỷ lệ / 10.000);
   GV chính = phần còn lại. Bỏ qua dòng có số tiền 0. Ghi bằng cách an toàn khi lặp (UNIQUE + insert bỏ qua trùng).
3. Gọi từ **đúng một chỗ** trong `commerce`: bước cấp ghi danh dùng chung của T2 và UC-A18 (`PaymentResultApplier.fulfil`),
   với danh sách khóa được cấp mới. `commerce` thêm `"payout :: api"` vào `allowedDependencies`. `payout` không bao giờ import `commerce`.
4. Đọc: `GET /me/earnings/summary|monthly|courses|entries` theo api-contract §6 của mobile; số dư **tính ra**, đáo hạn theo
   `edumy.payout.maturity` (`monthly`: phát sinh trong tháng M giờ `Asia/Ho_Chi_Minh` → khả dụng 00:00 ngày 01 tháng M+1;
   `immediate`: ngay). Quyền dựa trên việc sở hữu thu nhập, không dựa trên vai trò (BR-53). Kiểm cấu hình hợp lệ lúc khởi động.

**Test bắt buộc:** AC-M09 (499.000 đ → 149.700 / 87.325 / 34.930 / 227.045); kết quả muộn được chấp nhận và A18
`activated` có thu nhập; `refund_outside` và dòng trả trùng không có thu nhập (AC-M18); webhook lặp không ghi trùng;
đổi tỷ lệ chỉ áp dụng cho đơn sau (AC-M12); ranh giới tháng (AC-M13, dùng `MutableClock`); chạy lại toàn bộ test
tranh chấp của P11 (`PaymentRaceIT`…) và `ModularityTest`. Chạy `./mvnw test`.
