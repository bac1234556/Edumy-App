# Acceptance Criteria Checklist — Edumy Mobile (AC-M01 … AC-M18)

Bảng đối chiếu kiểm thử và nghiệm thu các tiêu chí chấp nhận (Acceptance Criteria) trên ứng dụng di động Edumy-App kết nối đồng bộ với backend trung tâm Edumy.

---

| Mã AC | Nghiệp vụ / Yêu cầu kiểm thử | Cách kiểm thử (Tự động / Thủ công) | Kết quả nghiệm thu |
|---|---|---|:---:|
| **AC-M01** | Khóa học của tôi (My Learning) hiển thị danh sách các khóa đã đăng ký (kể cả khóa bị ẩn trên catalog - BR-31) cùng tiến độ học (%) từ server. | Tự động: `src/features/learning/__tests__/logic.test.ts`<br>Thủ công: Mở Tab Học tập sau khi đăng ký khóa học trên Web/App. | ✅ ĐẠT |
| **AC-M02** | Xem nội dung bài học: ghi nhận visit (`POST /learn/lessons/{id}/visit`), phân giải player phù hợp (MP4/HLS qua expo-video, nguồn khác qua WebView fallback). Đánh dấu hoàn thành bài học thủ công (D-33). | Tự động: `resolvePlayerType`, `invalidateQueries` sau khi toggle.<br>Thủ công: Mở bài học, xem video, bấm hoàn thành bài học. | ✅ ĐẠT |
| **AC-M03** | Khôi phục phiên làm việc (Session restore): Khi mở lại ứng dụng, tự động đọc refresh token từ `expo-secure-store`, gọi `/auth/mobile/refresh` và `/me`. Nếu mật khẩu bị đổi trên Web, app xóa token và chuyển về màn hình đăng nhập. | Tự động: `src/api/__tests__/tokens.test.ts`, `src/features/auth/__tests__/logic.test.ts`<br>Thủ công: Đổi mật khẩu trên web, mở lại app thấy phiên kết thúc an toàn. | ✅ ĐẠT |
| **AC-M04** | Đăng xuất an toàn: Gọi `/auth/mobile/logout`, xóa refresh token khỏi SecureStore, dọn sạch `queryClient.clear()` và reset session bộ nhớ. Không bao giờ lưu token trong AsyncStorage. | Tự động: `src/features/auth/__tests__/logic.test.ts`<br>Thủ công: Bấm Đăng xuất trong tab Tài khoản. | ✅ ĐẠT |
| **AC-M05** | Giỏ hàng di động: Hiển thị danh mục khóa học, cảnh báo các khóa không thể mua kèm 4 lý do tiếng Việt (đã sở hữu, khóa học của chính bạn, miễn phí, ngừng bán). | Tự động: `src/features/cart/__tests__/logic.test.ts`<br>Thủ công: Thêm khóa học trên catalog vào giỏ hàng. | ✅ ĐẠT |
| **AC-M06** | Tuân thủ chính sách App Store / Google Play (BR-M01): Mobile **tuyệt đối không** có tính năng checkout/thanh toán trực tiếp. Nút chuyển hướng mở trình duyệt web `${WEB_BASE_URL}/cart` để thanh toán VNPay. | Tự động: Kiểm tra không có component hay nút "Thanh toán" trong mobile repo (`logic.test.ts`).<br>Thủ công: Bấm nút "Thanh toán trên Web" trong Giỏ hàng. | ✅ ĐẠT |
| **AC-M07** | Lịch sử đơn hàng: Xem danh sách và chi tiết đơn hàng ở chế độ chỉ đọc (read-only). Với đơn `PENDING`, hiển thị liên kết tiếp tục thanh toán trên web. | Tự động: `src/features/orders/__tests__/logic.test.ts`<br>Thủ công: Xem đơn hàng tại `app/orders/index.tsx` và `app/orders/[orderCode].tsx`. | ✅ ĐẠT |
| **AC-M08** | Cấp phát chứng chỉ tự động: Khi bài học cuối cùng hoàn thành đạt 100%, modal chúc mừng xuất hiện và dẫn người học đến trang Chứng chỉ. | Tự động: `src/features/learning/__tests__/logic.test.ts`<br>Thủ công: Đánh dấu hoàn thành toàn bộ bài học trong khóa. | ✅ ĐẠT |
| **AC-M09** | Hỏi & Đáp (Q&A) trong phòng học: Xem danh sách câu hỏi, lọc câu hỏi của tôi, đăng câu hỏi mới (tiêu đề ≤200, nội dung ≤5000), trả lời thảo luận. | Tự động: `src/features/qa/__tests__/logic.test.ts`<br>Thủ công: Vào phòng học `app/learn/[courseId]/qa.tsx`, tạo và trả lời câu hỏi. | ✅ ĐẠT |
| **AC-M10** | Chủ câu hỏi giải quyết Q&A: Tác giả câu hỏi có quyền đánh dấu đã giải quyết / mở lại câu hỏi (`POST /questions/{id}/resolve`). | Tự động: `src/features/qa/__tests__/logic.test.ts`<br>Thủ công: Bấm toggle giải quyết trên câu hỏi của mình. | ✅ ĐẠT |
| **AC-M11** | Đánh giá & nhận xét khóa học (Review): Học viên đã hoàn thành tối thiểu 1 bài học có thể đánh giá từ 1 đến 5 sao và viết nhận xét (≤2000 ký tự). Gửi lại sẽ cập nhật đánh giá cũ. | Tự động: `src/features/reviews/__tests__/logic.test.ts`<br>Thủ công: Đánh giá tại `app/courses/[slug]/write-review.tsx`. | ✅ ĐẠT |
| **AC-M12** | Quản lý chứng chỉ số: Danh sách chứng chỉ đã nhận, sao chép liên kết xác thực công khai `webLinks.certificate(code)`. | Tự động: `src/features/certificates/__tests__/logic.test.ts`<br>Thủ công: Vào `app/account/certificates.tsx`, bấm sao chép liên kết. | ✅ ĐẠT |
| **AC-M13** | Tải và chia sẻ chứng chỉ PDF: Tải file chứng chỉ qua endpoint `/api/v1/certificates/{id}/download` kèm Bearer token xác thực và chia sẻ qua hộp thoại hệ thống `expo-sharing`. | Tự động: Unit test `downloadAndShareCertificate` với mock `expo-file-system` & `expo-sharing`.<br>Thủ công: Bấm nút "Chia sẻ PDF" trên chứng chỉ. | ✅ ĐẠT |
| **AC-M14** | Hiển thị Tab Giảng viên (D-M01, BR-53): Tab Giảng viên tự động hiển thị nếu tài khoản có vai trò `instructor` HOẶC có doanh thu phát sinh (`hasEarnings: true`), kể cả khi vai trò bị thu hồi. | Tự động: `src/features/profile/__tests__/logic.test.ts` (kiểm tra đủ 4 trường hợp).<br>Thủ công: Đăng nhập tài khoản giảng viên hoặc đồng giảng viên. | ✅ ĐẠT |
| **AC-M15** | Bảng tổng kết doanh thu giảng viên (UC-I25): Hiển thị số dư khả dụng, chờ đáo hạn, đang rút, đã rút, tổng doanh thu; phân tích doanh thu theo tháng và khóa học. Giải thích chính sách đáo hạn (hoặc nhãn demo). | Tự động: `src/features/instructor/__tests__/logic.test.ts`<br>Thủ công: Xem màn hình `app/(tabs)/instructor.tsx`. | ✅ ĐẠT |
| **AC-M16** | Tài khoản nhận tiền (Payout Account - BR-52, BR-54): Chỉ hiển thị 4 chữ số cuối tài khoản ngân hàng. Cập nhật/khai báo bắt buộc nhập mật khẩu hiện tại để xác thực bảo mật. | Tự động: `payoutAccountSchema`, `maskAccountNumber` trong `logic.test.ts`.<br>Thủ công: Vào `app/instructor/payout-account.tsx`, nhập sai và đúng mật khẩu. | ✅ ĐẠT |
| **AC-M17** | Yêu cầu rút tiền (Withdrawal - UC-I27, BR-51): Nhập số tiền nguyên VNĐ, tối thiểu 100.000 đ, không vượt quá số dư khả dụng. Xử lý triệt để các mã lỗi máy chủ E1-E4 (`WITHDRAWAL_BELOW_MINIMUM`, `WITHDRAWAL_EXCEEDS_BALANCE`, `PAYOUT_ACCOUNT_REQUIRED`, `WITHDRAWAL_ALREADY_OPEN`). | Tự động: `validateWithdrawalAmount` trong `logic.test.ts`.<br>Thủ công: Tạo yêu cầu rút tại `app/instructor/withdrawals/new.tsx`. | ✅ ĐẠT |
| **AC-M18** | Lịch sử rút tiền & Hủy yêu cầu (UC-I28): Xem lịch sử rút tiền với 4 trạng thái tiếng Việt, mã giao dịch khi đã chuyển, lý do từ chối. Cho phép hủy yêu cầu khi đang ở trạng thái `requested`. | Tự động: `getWithdrawalStatusInfo` trong `logic.test.ts`.<br>Thủ công: Xem danh sách và bấm Hủy tại `app/instructor/withdrawals/index.tsx`. | ✅ ĐẠT |

---

### Kết luận kiểm toán
- **Tổng số test suites:** 16/16 Passed.
- **Tổng số unit tests:** 106/106 Passed (100%).
- **Kiểm tra kiểu dữ liệu (TypeScript):** 0 lỗi (`npx tsc --noEmit`).
- **Kiểm tra cú pháp & quy chuẩn (ESLint):** 0 cảnh báo (`npm run lint`).
- **An toàn bảo mật:** 0 AsyncStorage, 0 lộ token trong URL hoặc log.
