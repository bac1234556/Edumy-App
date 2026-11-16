# M05 — Giỏ hàng không thanh toán và lịch sử đơn

**Phụ thuộc:** M04. **UC:** S01, S02, S03, S06, S07, UC-M01. **Quy tắc:** BR-M01, D-M06. **AC:** AC-M05, M06, M07.

**Đọc trước:** rules 40 phần "Cart" và "Orders", api-contract §3 và mục "Never call", đặc tả 4.2–4.3.

**Việc cần làm**
1. Tab Giỏ hàng: danh sách dòng, giá hiện tại, lý do không mua được (4 mã), tổng tiền = `totalAmount` của server,
   xóa dòng (có xác nhận), dòng `now_free` có nút "Ghi danh ngay".
2. Chân màn: "Vui lòng truy cập website để tiến hành thanh toán" + nút "Mở website" (`webLinks.cart()`).
3. `orders/index` và `orders/[orderCode]`: chỉ xem; đơn `pending` có ghi chú và nút "Tiếp tục trên website".
4. Khi app trở lại foreground: tải lại giỏ, đơn hàng và Khóa của tôi (người dùng có thể vừa thanh toán trên web).

**Không được:** gọi bất kỳ endpoint nào trong mục "Never call"; hiển thị QR; nút hủy đơn.

**Xong khi:** test khẳng định không có nút nào có chữ "Thanh toán"; test nhãn lý do; thử thủ công AC-M06
(thêm trên app → thấy trên web). Ghi lại đường dẫn giỏ hàng web đang dùng vào progress (Q-M02).
