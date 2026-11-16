# Thanh toán VNPay sandbox (W10-D1 / Issue #95)

Mặc định hệ thống dùng **mock** (thanh toán giả lập luôn thành công). VNPay sandbox là tùy chọn, bật bằng cờ cấu hình;
không đặt gì thì hành vi giữ nguyên như cũ.

## 1. Đăng ký tài khoản sandbox (làm một lần, cần người thực hiện)

1. Đăng ký merchant sandbox tại trang đăng ký của VNPay (mục "Đăng ký tài khoản Test / Sandbox" trên https://sandbox.vnpayment.vn).
2. VNPay gửi email gồm **TmnCode** (mã website) và **HashSecret** (chuỗi bí mật). Không commit hai giá trị này lên git.
3. Trong cổng quản trị merchant, khai báo **IPN URL** là địa chỉ công khai của backend: `https://<host>/api/v1/payments/vnpay/ipn`
   (VNPay gọi server-to-server nên cần địa chỉ truy cập được từ Internet).

## 2. Cấu hình backend

| Biến môi trường | Thuộc tính Spring | Ý nghĩa |
| --- | --- | --- |
| `PAYMENT_PROVIDER` | `payment.provider` | `mock` (mặc định) hoặc `vnpay` |
| `PAYMENT_VNPAY_TMNCODE` | `payment.vnpay.tmn-code` | TmnCode do VNPay cấp |
| `PAYMENT_VNPAY_HASHSECRET` | `payment.vnpay.hash-secret` | HashSecret do VNPay cấp |
| `PAYMENT_VNPAY_RETURNURL` | `payment.vnpay.return-url` | URL công khai của `GET /api/v1/payments/vnpay/return` (trình duyệt của người dùng được chuyển về đây, nên có thể là địa chỉ LAN/`10.0.2.2` khi thử trên emulator) |
| `PAYMENT_VNPAY_PAYURL` | `payment.vnpay.pay-url` | Mặc định `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `PAYMENT_APPREDIRECT` | `payment.app-redirect` | Deep link mở lại app, mặc định `edumy://payment-result` |

Ví dụ:

```bash
export PAYMENT_PROVIDER=vnpay
export PAYMENT_VNPAY_TMNCODE=ABCD1234
export PAYMENT_VNPAY_HASHSECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export PAYMENT_VNPAY_RETURNURL=https://api.example.com/api/v1/payments/vnpay/return
./mvnw spring-boot:run
```

`provider=vnpay` mà thiếu TmnCode / HashSecret / Return URL thì backend **không khởi động** (báo lỗi rõ ràng); giá trị `provider` lạ cũng vậy.
Khi bật `vnpay`, server từ chối yêu cầu checkout gửi `paymentMethod: MOCK`, nên không thể dùng mock để qua mặt thanh toán thật.

## 3. Luồng thanh toán

```text
App ──POST /orders/checkout {courseId, returnUri}──▶ Backend
        Order PENDING (VNPAY) + paymentUrl đã ký HMAC-SHA512  ◀──
App ──expo-web-browser mở paymentUrl──▶ Trang thanh toán VNPay
VNPay ──(1) trình duyệt chuyển về Return URL──▶ Backend: xác minh checksum + số tiền
                                                 PAID + tạo Enrollment (hoặc FAILED) ──302──▶ edumy://payment-result?status=..&txnRef=..
VNPay ──(2) IPN server-to-server──▶ Backend: xử lý như trên, trả {"RspCode":"00","Message":"Confirm Success"}
App ──GET /orders/{txnRef}──▶ trạng thái đơn (nguồn tin cậy) ──▶ màn Payment result
```

- Return URL và IPN **dùng chung một logic, xử lý lặp lại an toàn**: đơn đã PAID/FAILED thì không ghi danh thêm lần nữa.
- **Sai checksum bị từ chối**: không đổi trạng thái đơn, không ghi danh; Return URL quay về app với `status=INVALID`, IPN trả `RspCode 97`.
- Số tiền (`vnp_Amount` = giá × 100) phải khớp đơn, nếu không IPN trả `04` và đơn không được ghi nhận.
- Mã IPN theo đặc tả VNPay: `00` thành công · `01` không thấy đơn · `02` đã xác nhận · `04` sai số tiền · `97` sai checksum · `99` lỗi khác.
- Deep link quay về app chỉ được `edumy://`, `exp://` (Expo Go) và `exps://`; địa chỉ khác bị từ chối (chống open redirect).
- Thẻ test: lấy trong mục "Thông tin thẻ test" của tài liệu sandbox VNPay (https://sandbox.vnpayment.vn/apis/vnpay-demo/).

## 4. Kiểm thử

- Tự động: `VnpayGatewayTest` (chữ ký so với cài đặt độc lập của thuật toán, từ chối mọi kiểu sửa tham số, cấu hình) và
  `VnpayPaymentFlowTest` (checkout, Return URL, IPN, trạng thái đơn) trong `backend/src/test`.
- Thủ công với sandbox thật (cần TmnCode/HashSecret): bật `vnpay`, mua một khóa có phí trên app, thanh toán bằng thẻ test,
  kiểm tra khóa xuất hiện trong My Learning; thử sửa một tham số trên URL Return để thấy `status=INVALID` và đơn không đổi.

## 5. Chưa kiểm chứng

Chưa có TmnCode/HashSecret thật nên chưa chạy thanh toán thật với sandbox của VNPay, và chưa thử luồng mở trình duyệt / deep link
trên thiết bị Android. Đây là các bước cần làm trước khi đóng hẳn issue #95.
