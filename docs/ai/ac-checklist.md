# Acceptance Criteria Checklist — Edumy Mobile (v2 & BR-MOBILE-SCOPE)

Bảng đối chiếu kiểm thử và nghiệm thu các tiêu chí chấp nhận trên ứng dụng di động Edumy-App kết nối đồng bộ với backend trung tâm Edumy (API Contract v2).

---

| Mã AC | Nghiệp vụ / Yêu cầu kiểm thử | Cách kiểm thử (Tự động / Thủ công) | Kết quả nghiệm thu |
|---|---|---|:---:|
| **BR-MOBILE-SCOPE** | Ứng dụng = Học tập + Kênh giảng viên. **Bỏ hoàn toàn giỏ hàng và lịch sử đơn hàng** (`/cart`, `/orders`). Khóa trả phí hiển thị nút **"Mua trên website"** mở `${WEB_BASE_URL}/courses/{id}` qua `expo-web-browser`. | Tự động: `resolveCourseAction` trong `src/features/catalog/__tests__/logic.test.ts`; kiểm tra không còn `/cart` hoặc `/orders` trong `app/` và `src/`. | ✅ ĐẠT |
| **AC-M01** | Khóa học của tôi (My Learning) hiển thị danh sách phân trang vô hạn các khóa đã đăng ký cùng % tiến độ từ server và nút "Học tiếp". | Tự động: `src/features/learning/__tests__/logic.test.ts`<br>Thủ công: Mở Tab Học tập sau khi ghi danh / mua trên Web. | ✅ ĐẠT |
| **AC-M02** | Xem nội dung bài học: ghi nhận visit (`POST /learn/lessons/{id}/visit`), điều hướng Bài trước / Bài sau, hoàn thành thủ công (`PUT completion`), quiz hiển thị liên kết làm trên website để % tiến độ khớp 100% với web. | Tự động: `isNativeStream`, `resolveFirstOrUncompletedLesson`.<br>Thủ công: Hoàn thành bài trên web → app cập nhật đúng %. | ✅ ĐẠT |
| **AC-M03** | Khôi phục phiên làm việc (`useRestoreSession`): chỉ xóa token khi `401 AUTH_REFRESH_INVALID`/`AUTH_REFRESH_REUSED` hoặc `403 AUTH_ACCOUNT_LOCKED`; lỗi mạng giữ token và hiện banner offline + "Thử lại". | Tự động: `src/features/auth/__tests__/hooks.test.ts`.<br>Thủ công: Tắt backend mở app → banner offline; bật lại bấm Thử lại. | ✅ ĐẠT |
| **AC-M04** | Đăng xuất an toàn trên Native & Web (`dialog.ts`, `sessionEpoch` guard, `cancelQueries()`, `queryClient.clear()`, xóa SecureStore/memory token, best-effort `/auth/mobile/logout`, điều hướng login). Đổi mật khẩu thu hồi mọi thiết bị và đăng xuất. | Tự động: `client.test.ts`, `hooks.test.ts`, `dialog.test.ts`, `tokens.test.ts`.<br>Thủ công: Đăng xuất trên Android Emulator & Web. | ✅ ĐẠT |
| **AC-M08** | Cấp phát chứng chỉ tự động: `certificateJustIssued: true` → màn chúc mừng kèm mã `EDUMY-…` và link sang Chứng chỉ. | Tự động + Thủ công: Hoàn thành 100% khóa học. | ✅ ĐẠT |
| **AC-M09..M10** | Q&A và Đánh giá: dùng đúng schema v2 (`isResolved`, `askerName`, `authorName`, `DELETE /reviews/{id}`, `resolve`). | Tự động: `qa/__tests__/logic.test.ts`, `reviews/__tests__/logic.test.ts`. | ✅ ĐẠT |
| **AC-M12..M13** | Chứng chỉ số (`GET /me/certificates`): tải PDF kèm Bearer trên native (`FileSystem.downloadAsync` + `Sharing`), mở `verifyUrl` trên web, sao chép `verifyUrl`. | Tự động: `src/features/certificates/__tests__/logic.test.ts`. | ✅ ĐẠT |
| **AC-M14..M18** | Kênh giảng viên 5 phần (Tổng quan, Khóa học + học viên + lời mời, Hỏi đáp, Thu nhập BR-PAY-HOLD theo `holdDays` & `nextMaturityAt`, Rút tiền & Tài khoản nhận tiền). | Tự động: `profile/__tests__/logic.test.ts`, `instructor/__tests__/logic.test.ts`. | ✅ ĐẠT |
