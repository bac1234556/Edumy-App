# Kịch bản demo 10 phút — Edumy (W10-D2 / Issue #96)

**Câu chuyện demo:** *Giảng viên đăng khóa → Admin duyệt → Học viên mua và học video → Hỏi đáp, đánh giá và nhận chứng chỉ.*
Đây là vòng đời sản phẩm đã khóa ở `docs/scope-and-backlog.md`.

## 1. Phân vai

| Thành viên | GitHub | Phần thao tác | Thiết bị |
| --- | --- | --- | --- |
| **A** (dẫn chương trình, Auth) | `manhdanhtran` | Mở đầu, đăng ký/đăng nhập, tổng kết | Thiết bị 1 (Học viên) |
| **C** (Giảng viên) | `PhamHung210` | Tạo khóa, giáo trình, upload video, gửi duyệt, trả lời Q&A | Thiết bị 2 (Giảng viên) |
| **E** (Quản trị, Q&A) | `ngohuudiep` | Duyệt/từ chối khóa, hỏi đáp | Thiết bị 3 (Admin) |
| **B** (Catalog, Review) | `bac1234556` | Tìm kiếm, chi tiết khóa, wishlist, đánh giá | Thiết bị 1 (Học viên) |
| **D** (Learning) | `chung-lol` | Mua khóa, học, tiếp tục học, chứng chỉ | Thiết bị 1 (Học viên) |

Dùng 3 thiết bị/emulator đã cài sẵn APK và đã đăng nhập trước: Thiết bị 1 = `student@edumy.com`, Thiết bị 2 = `instructor@edumy.com`,
Thiết bị 3 = `admin@edumy.com` (mật khẩu demo `Admin@123456`, chỉ dùng ở môi trường demo). Thiết bị 1 được chuyền tay A → B → D.
Một người dẫn (A) giữ nhịp và nói bước tiếp theo, mỗi người chỉ thao tác phần của mình.

## 2. Chuẩn bị trước giờ demo (T−30 phút)

| # | Việc | Người | Xong |
| --- | --- | --- | :---: |
| 1 | Backend chạy, `GET /api/health` trả `UP`; đã merge #73, #74, #75 (và #95 nếu demo VNPay) | A | ☐ |
| 2 | Cài đúng APK cần nghiệm thu trên 3 thiết bị, kiểm tra mạng ổn định (ưu tiên cùng Wi-Fi với backend hoặc dùng backend HTTPS) | A | ☐ |
| 3 | Chuẩn bị **video mẫu ngắn** (MP4 H.264, 720p, 60–90 giây, < 20 MB) trên Thiết bị 2 để upload nhanh | C | ☐ |
| 4 | Tạo sẵn **khóa dự phòng ở trạng thái PENDING** (đủ ≥ 1 chương và 1 bài) để demo "Từ chối" mà không phải tạo thêm | C | ☐ |
| 5 | Tài khoản học viên **chưa sở hữu** khóa dùng demo mua; tạo sẵn một **khóa "gần xong"**: học viên đã hoàn thành mọi bài trừ bài cuối (bài video 60 giây) | D | ☐ |
| 6 | Xóa dữ liệu thử cũ của buổi demo trước (đơn hàng, đánh giá, câu hỏi của tài khoản demo) hoặc dùng cơ sở dữ liệu demo mới | A | ☐ |
| 7 | Mở sẵn Swagger (`/swagger-ui`) trên máy tính để minh họa verify chứng chỉ công khai | D | ☐ |
| 8 | Quay sẵn video màn hình toàn bộ kịch bản làm **kế hoạch dự phòng** nếu mạng hoặc thiết bị gặp sự cố | A | ☐ |

## 3. Kịch bản từng phút

| Thời gian | Ai | Thao tác | Kết quả cần thấy | Case liên quan |
| --- | --- | --- | --- | --- |
| **0:00 – 0:40** | A | Giới thiệu bài toán, ba vai trò và vòng đời sản phẩm; nói gọn kiến trúc: React Native/Expo + Spring Boot + MySQL + Cloudinary | Khán giả nắm được luồng sẽ xem | — |
| **0:40 – 1:30** | A | Thiết bị 1: đăng ký một học viên mới (email trong buổi demo, mật khẩu ≥ 8 ký tự) → đăng nhập → mở Hồ sơ, đổi tên | Đăng ký rồi đăng nhập thành công; tên trên thanh đầu trang đổi ngay | TC-01, TC-03, TC-06 |
| **1:30 – 3:30** | C | Thiết bị 2: Góc giảng viên → tạo khóa "Demo 10 phút" (mô tả, danh mục, giá 99.000đ) → thêm 1 chương, 1 bài → upload video mẫu (cho khán giả thấy thanh tiến trình) → **Gửi duyệt** | Khóa ở DRAFT rồi chuyển PENDING; nếu cố gửi khi chưa có bài thì bị từ chối (nói miệng hoặc thao tác nhanh) | TC-26, TC-27, TC-28 |
| **3:30 – 4:30** | E | Thiết bị 3: Hàng chờ duyệt → mở "Demo 10 phút" xem giáo trình và video → **Duyệt** (xác nhận). Mở khóa dự phòng → **Từ chối**: thử bỏ trống lý do (bị chặn) rồi nhập lý do | Khóa được duyệt biến mất khỏi hàng chờ; khóa bị từ chối bắt buộc có lý do. C bấm Thông báo ở Thiết bị 2 thấy cả hai kết quả | TC-30, TC-31, TC-24 |
| **4:30 – 5:30** | B | Thiết bị 1: Khám phá → tìm "Demo", lọc theo danh mục và giá → mở khóa vừa duyệt → xem giáo trình, **phát bài xem thử**, thử chạm bài khóa → bấm tim thêm Wishlist | Khóa mới xuất hiện ngay ở catalog; bài khóa không lộ video; Wishlist có khóa | TC-08, TC-09, TC-10, TC-11 |
| **5:30 – 6:30** | D | Thiết bị 1: ĐĂNG KÝ HỌC → Checkout → Thanh toán (mock; nếu bật VNPay thì thanh toán bằng thẻ test) → màn kết quả có mã giao dịch → **Vào học ngay**. Quay lại Checkout cùng khóa để cho thấy bị chặn mua trùng | Khóa có ngay trong Khóa học của tôi; báo "Bạn đã sở hữu khóa học này" | TC-13, TC-14, TC-16 (TC-25 nếu VNPay) |
| **6:30 – 7:30** | D | Player: Phát/Tạm dừng, −10s/+10s, **Toàn màn hình** xoay ngang rồi thoát. Xem khoảng 20 giây, **tắt hẳn app**, mở lại → Khóa học của tôi → **Tiếp tục học** | Vào đúng bài và đúng giây đang xem dở (lệch ≤ 10 giây) | TC-17, TC-18 |
| **7:30 – 8:30** | D | Mở khóa **"gần xong"**: tua tới ≥ 90% bài cuối, tạm dừng → bài tự có ✓ và tiến độ 100% → bấm **Xem chứng chỉ** → Tải về PDF → Chia sẻ → bấm Xác minh; trên máy tính gọi `GET /api/certificates/<mã>/verify` không cần token | Có mã `EDUMY-…`; PDF đúng tên (có dấu), khóa, giảng viên, ngày; verify hợp lệ, sửa 1 ký tự thì 404 | TC-19, TC-20, TC-21 |
| **8:30 – 9:20** | E, C, B | E (Thiết bị 1): đặt câu hỏi dưới một bài học. C (Thiết bị 2): trả lời và đánh dấu chấp nhận. B (Thiết bị 1): đánh giá khóa 5 sao kèm nhận xét | Câu hỏi hiện dưới đúng bài; giảng viên nhận thông báo; điểm trung bình khóa cập nhật | TC-23, TC-22 |
| **9:20 – 10:00** | A | Tổng kết: số test tự động đang PASS (xem `docs/test-cases.md` mục 3), CI xanh, bảng kết quả TC, các giới hạn đã biết (VNPay mới chạy sandbox, chưa có iOS). Mở phần hỏi đáp | Khán giả có số liệu kiểm chứng | — |

Tổng thời lượng: **10 phút** (dự phòng 0 phút, nên tập trước để không vượt). Các bước có chữ **đậm** là điểm bắt buộc phải cho khán giả thấy.

## 4. Kế hoạch dự phòng (nếu bước bị lỗi)

| Sự cố | Xử lý ngay | Ai |
| --- | --- | --- |
| Upload video chậm hoặc lỗi mạng | Dùng khóa dự phòng PENDING có sẵn để duyệt; nói rõ upload đã kiểm thử ở TC-27 | C |
| Video không phát | Chuyển sang bài xem thử; nếu vẫn lỗi, phát đoạn video quay sẵn và ghi bug vào #97 | D |
| Thanh toán VNPay lỗi | Quay lại cổng `mock` (`PAYMENT_PROVIDER=mock`, khởi động lại backend) — luồng khóa học không đổi | A |
| Mất mạng / backend không phản hồi | Chuyển sang video quay sẵn, ghi nhận sự cố ở mục 5 | A |
| Không có thông báo / dữ liệu cũ | Vuốt kéo làm mới; kiểm tra tài khoản đang đăng nhập đúng vai trò | người thao tác |

## 5. Nhật ký chạy thử trên APK (điều kiện nghiệm thu: cả nhóm đều Pass)

Mỗi thành viên chạy trọn kịch bản trên APK và điền một dòng. Dòng **Fail** phải có link issue bug.

| Thành viên | APK / SHA backend | Thiết bị | Ngày | Kết quả | Ghi chú / bug |
| --- | --- | --- | --- | :---: | --- |
| A (`manhdanhtran`) | | | | ☐ Pass ☐ Fail | |
| B (`bac1234556`) | | | | ☐ Pass ☐ Fail | |
| C (`PhamHung210`) | | | | ☐ Pass ☐ Fail | |
| D (`chung-lol`) | | | | ☐ Pass ☐ Fail | |
| E (`ngohuudiep`) | | | | ☐ Pass ☐ Fail | |

Chưa có dòng nào được chạy trên APK tại thời điểm viết tài liệu; các ô trên cần người thực hiện điền sau khi chạy thật.
