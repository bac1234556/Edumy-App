# Shared states và đổi mật khẩu (W9-A1)

Import `LoadingView`, `ErrorView`, `EmptyView` từ `mobile/src/components/common`.
`LoadingView` nhận `message`; `ErrorView` nhận `message` và `onRetry`;
`EmptyView` nhận `message` và children tùy chọn. ProfileScreen minh họa cả ba trạng thái.

`NetworkSnackbar` đặt một lần trong root PaperProvider. Axios `api` và `authClient`
báo lỗi không có HTTP response (mạng/timeout); request bị hủy không báo lỗi.
Các lỗi đồng thời dùng chung một snackbar; lỗi HTTP do màn hình xử lý.

`PUT /api/users/me/password` (alias `/api/v1/users/me/password`) cần bearer token và
`{ "oldPassword": "...", "newPassword": "..." }`. Mật khẩu mới dài 8–72 ký tự,
không vượt 72 byte UTF-8, khác mật khẩu cũ. Trả 400 khi sai mật khẩu/dữ liệu,
401 khi chưa đăng nhập, 200 với `{ success: true, data: null, message: ... }` khi xong.

Đổi password và thu hồi toàn bộ refresh token trong cùng transaction. Login,
refresh và đổi password khóa cùng user row để token phát hành đồng thời không
thoát việc thu hồi. Access token hiện tại hết hạn theo TTL; thiết bị khác bị
đăng xuất ở lần refresh kế tiếp. ProfileScreen xóa phiên hiện tại khi đổi thành công.

Kiểm chứng: `ChangePasswordControllerTest`, `AuthControllerTest`,
`ProfileScreen.test.js`, `client.test.js` và Android Expo export.
