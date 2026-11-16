# M03 — Khung tab và Tài khoản

**Phụ thuộc:** M02.

**Đọc trước:** rules 10 (cây `app/`), rules 50, đặc tả mục 2.1 (D-M01), 4.6.

**Việc cần làm**
1. `(tabs)/_layout.tsx`: Khám phá · Học tập · Giỏ hàng · Tài khoản, cùng tab **Giảng viên** ẩn theo D-M01.
   Lúc này chỉ dùng điều kiện `me.roles` chứa `instructor` (phần `hasEarnings` thêm ở M08); viết thành hàm
   thuần `shouldShowInstructorTab(me, earningsSummary?)` trong `features/profile/logic.ts` để M08 mở rộng.
2. Màn Tài khoản: thông tin người dùng, banner "Chưa xác thực email" + nút "Gửi lại thư" (429 → đếm ngược),
   lối vào Đơn hàng, Chứng chỉ, Hồ sơ, Đổi mật khẩu, Đăng xuất (có xác nhận).
3. `account/profile` (sửa họ tên ≤100) và `account/change-password` (báo rằng các thiết bị khác sẽ bị đăng xuất).
4. Đọc lại `GET /me` khi app trở lại foreground (để cập nhật `emailVerified` sau khi xác thực trên web).

**Xong khi:** test cho `shouldShowInstructorTab` (chỉ vai trò / không gì cả); các màn có đủ 4 trạng thái; lệnh kiểm tra xanh.
