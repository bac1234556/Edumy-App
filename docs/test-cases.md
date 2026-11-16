# Test case end-to-end — Edumy (W10-D2 / Issue #96)

33 test case cho 3 vai trò **STUDENT**, **INSTRUCTOR**, **ADMIN** (cộng nhóm **Chung** cho đăng ký/đăng nhập/hồ sơ).
Mỗi case có hai loại kết quả, ghi tách bạch để không nhầm bằng chứng:

| Cột | Ý nghĩa | Ai ghi |
| --- | --- | --- |
| **Tự động** | Test trong repo bao phủ case này (backend JUnit/MockMvc, mobile Jest). Chỉ ghi PASS khi test đã chạy thật. | Đã điền ở mục 3 |
| **APK** | Người test chạy tay trên **APK/emulator** theo các bước trong bảng và ghi **Pass** hoặc **Fail** (kèm ghi chú/bug). | Người chạy, điền khi test |

Ký hiệu cột APK: `☐ Pass ☐ Fail` = chưa chạy. Khi chạy xong thay bằng `✅ Pass` hoặc `❌ Fail (#<số issue bug>)`. Gặp Fail mức high thì tạo issue bug và đưa vào task list của #97.

## 1. Môi trường test

| Hạng mục | Giá trị |
| --- | --- |
| App | APK từ EAS preview (xem `docs/android-preview.md`) hoặc Android emulator API ≥ 29 |
| Backend | Bản đã deploy (`docs/deploy.md`) hoặc local `docker compose up --build` với profile `demo` (`docs/W8_PLATFORM.md`) |
| Tài khoản demo | `student@edumy.com`, `instructor@edumy.com`, `admin@edumy.com`, mật khẩu `Admin@123456` (chỉ môi trường local/demo, tuyệt đối không dùng trên Internet) |
| Dữ liệu | 10 khóa PUBLISHED sẵn có, mỗi khóa có 1 bài xem thử + 1 bài khóa. Khóa có phí giá 99.000đ; cần thêm 1 khóa 0đ (instructor tạo hoặc seed) |
| Thanh toán | Mặc định `payment.provider=mock`; TC-25 cần `vnpay` + tài khoản sandbox (`docs/PAYMENT_VNPAY.md`) |
| Cần đã merge | #73 (API tiến độ), #74 (Player lưu vị trí), #75 (chứng chỉ) cho TC-18 → TC-21; #95 cho TC-25 |

Mỗi lần chạy ghi lại: phiên bản APK / SHA backend, thiết bị hoặc emulator, mạng (Wi-Fi/4G), người chạy, ngày.

## 2. Danh sách test case

### 2.1. Chung (mọi vai trò)

| ID | Tiền điều kiện | Các bước | Kết quả mong đợi | Tự động | APK |
| --- | --- | --- | --- | --- | --- |
| **TC-01** Đăng ký học viên | Email chưa có trong hệ thống | 1. Màn đăng nhập → Đăng ký<br>2. Nhập họ tên, email mới, mật khẩu ≥ 8 ký tự, chọn vai trò Học viên<br>3. Bấm Đăng ký | Chuyển sang màn đăng nhập kèm xác nhận đã đăng ký; đăng nhập được bằng tài khoản vừa tạo | AuthControllerTest · AuthScreen.test.js | ☐ Pass ☐ Fail |
| **TC-02** Đăng ký sai dữ liệu | — | Đăng ký với: (a) email đã tồn tại, (b) mật khẩu < 8 ký tự, (c) email sai định dạng, (d) cố chọn vai trò Admin | Mỗi trường hợp báo lỗi rõ ràng, không tạo tài khoản, không cho đăng ký Admin | AuthControllerTest · AuthScreen.test.js | ☐ Pass ☐ Fail |
| **TC-03** Đăng nhập đúng vai trò | Có 3 tài khoản demo | Đăng nhập lần lượt student, instructor, admin | Vào đúng khu vực của vai trò: Góc học viên / Góc giảng viên / Quản trị | AuthScreen.test.js · RoleLayout.test.js | ☐ Pass ☐ Fail |
| **TC-04** Đăng nhập bị từ chối | Có 1 tài khoản đã bị Admin khóa | (a) Nhập sai mật khẩu<br>(b) Đăng nhập tài khoản đã khóa | Cả hai bị từ chối kèm thông báo; không vào được app | AuthControllerTest · AdminUserControllerTest | ☐ Pass ☐ Fail |
| **TC-05** Giữ phiên và đăng xuất | Đã đăng nhập | 1. Đóng hẳn app (vuốt tắt), mở lại<br>2. Bấm Đăng xuất | Mở lại vẫn đăng nhập (phiên lưu SecureStore, token tự làm mới); sau đăng xuất quay về màn đăng nhập và không tự vào lại | authStore.test.js · client.test.js · AuthControllerTest | ☐ Pass ☐ Fail |
| **TC-06** Cập nhật hồ sơ | Đã đăng nhập | Hồ sơ → sửa họ tên, giới thiệu, chọn ảnh đại diện (PNG/JPEG ≤ 2 MB) → Lưu | Tên và ảnh trên thanh đầu trang đổi ngay; mở lại app vẫn giữ; file không phải ảnh bị từ chối | ProfileControllerTest · ProfileScreen.test.js | ☐ Pass ☐ Fail |
| **TC-07** Đổi mật khẩu | Đã đăng nhập | Hồ sơ → đổi mật khẩu: (a) mật khẩu cũ sai, (b) đúng | (a) báo lỗi, giữ phiên; (b) các thiết bị bị đăng xuất, đăng nhập lại bằng mật khẩu mới được, mật khẩu cũ không còn dùng được | ChangePasswordControllerTest · ProfileScreen.test.js | ☐ Pass ☐ Fail |

### 2.2. Học viên (STUDENT)

| ID | Tiền điều kiện | Các bước | Kết quả mong đợi | Tự động | APK |
| --- | --- | --- | --- | --- | --- |
| **TC-08** Danh sách khóa học | Đăng nhập student | 1. Khám phá khóa học, cuộn xuống cuối<br>2. Tắt mạng rồi tải lại | Thấy khóa PUBLISHED có ảnh, giá, giảng viên, tự tải thêm trang; mất mạng hiện lỗi và nút Thử lại; không có khóa thì hiện trạng thái trống | CoursePublicControllerTest | ☐ Pass ☐ Fail |
| **TC-09** Tìm kiếm và lọc | Có nhiều khóa | Tìm theo từ khóa; lọc theo danh mục, miễn phí/trả phí, cấp độ; đổi cách sắp xếp | Kết quả khớp tiêu chí; từ khóa không khớp hiện trạng thái trống | CoursePublicControllerTest (#41) | ☐ Pass ☐ Fail |
| **TC-10** Chi tiết khóa và xem thử | Có khóa với bài xem thử + bài khóa | Mở chi tiết khóa; mở giáo trình; phát bài xem thử; chạm bài bị khóa | Giáo trình theo chương; bài xem thử phát được; bài khóa có biểu tượng khóa và không lộ link video | CoursePublicControllerTest | ☐ Pass ☐ Fail |
| **TC-11** Wishlist | Đăng nhập student | Bấm tim ở chi tiết khóa; mở Wishlist; bỏ tim | Khóa vào/ra danh sách tức thì; bấm nhiều lần không bị trùng | WishlistControllerTest · WishlistAndReview.test.js | ☐ Pass ☐ Fail |
| **TC-12** Đăng ký khóa 0đ | Có khóa giá 0đ, student chưa sở hữu | Chi tiết khóa → ĐĂNG KÝ HỌC → Đăng ký miễn phí | Màn kết quả "Đăng ký khóa học thành công"; khóa xuất hiện trong Khóa học của tôi, không phát sinh đơn hàng | LearningControllerTest · LearningScreens.test.js | ☐ Pass ☐ Fail |
| **TC-13** Mua khóa có phí (mock) | Khóa 99.000đ, student chưa sở hữu | Chi tiết khóa → ĐĂNG KÝ HỌC → Checkout (thấy tên, giá, phương thức) → Thanh toán | Màn kết quả "Đặt hàng thành công" có mã giao dịch; "Vào học ngay" mở Player; khóa có ngay trong Khóa học của tôi | LearningControllerTest · LearningScreens.test.js | ☐ Pass ☐ Fail |
| **TC-14** Chặn mua trùng | Student đã sở hữu khóa | Mở lại Checkout của khóa đó → Thanh toán | Báo "Bạn đã sở hữu khóa học này" và có nút Vào học; không tạo thêm đơn | LearningControllerTest · LearningScreens.test.js | ☐ Pass ☐ Fail |
| **TC-15** Chặn bài chưa mua | Student chưa sở hữu khóa | Mở Player của khóa đó và chọn một bài thường | Báo cần mua khóa, có nút Mua khóa học, không phát video; bài xem thử vẫn mở | LessonAccessControllerTest · CoursePlayerScreen.test.js | ☐ Pass ☐ Fail |
| **TC-16** Khóa học của tôi | Student có khóa đã mua | Mở Khóa học của tôi; thử với tài khoản chưa mua gì; thử khi mất mạng | Thấy khóa kèm thanh tiến độ; chưa mua hiện trạng thái trống + Khám phá khóa học; lỗi mạng hiện Thử lại | LearningControllerTest · LearningScreens.test.js | ☐ Pass ☐ Fail |
| **TC-17** Player cơ bản | Student đã mua khóa có ≥ 2 bài video | 1. Mở Player, bấm Phát/Tạm dừng<br>2. Bấm −10s và +10s<br>3. Toàn màn hình rồi thoát<br>4. Bấm bài khác trong danh sách | Video phát mượt từ Cloudinary; tua đúng; toàn màn hình xoay ngang và quay lại dọc; bài đang phát được đánh dấu và đổi bài đúng | CoursePlayerScreen.test.js (logic) | ☐ Pass ☐ Fail |
| **TC-18** Lưu vị trí và tiếp tục học | Đã merge #73/#74 | 1. Xem một bài khoảng 25 giây<br>2. Tắt hẳn app<br>3. Mở lại → Khóa học của tôi → Tiếp tục học | Vào đúng bài đang xem dở, đúng giây (lệch ≤ 10 giây) | LearningProgressControllerTest · LessonProgressTracking.test.js (PR #107, #108) | ☐ Pass ☐ Fail |
| **TC-19** Tự hoàn thành bài | Đã merge #73/#74 | 1. Xem một video tới ≥ 90%<br>2. Mở bài không có video và bấm Hoàn thành | Bài đạt 90% có dấu ✓ không cần bấm nút; bài không video có ✓ sau khi bấm; tiến độ khóa tăng | LearningProgressControllerTest · LessonProgressTracking.test.js (PR #107, #108) | ☐ Pass ☐ Fail |
| **TC-20** Nhận chứng chỉ PDF | Đã merge #75; hoàn thành mọi bài | Khóa học của tôi → Chứng chỉ → Tải về PDF và Chia sẻ | Có mã `EDUMY-<năm>-<8 ký tự>`; PDF mở được, có tên học viên (đúng dấu tiếng Việt), tên khóa, giảng viên, ngày cấp, mã; chia sẻ mở được hộp thoại hệ thống | CertificateControllerTest · CertificatePdfRendererTest · CertificateScreen.test.js (PR #110) | ☐ Pass ☐ Fail |
| **TC-21** Xác minh chứng chỉ | Có mã chứng chỉ | (a) Bấm Xác minh trong màn Certificate<br>(b) Gọi `GET /api/certificates/<mã>/verify` không token<br>(c) Sửa một ký tự của mã<br>(d) Tài khoản khác tải PDF của mã này | (a)(b) hợp lệ kèm tên học viên và khóa; (c) 404 "Mã chứng chỉ không tồn tại"; (d) 403 | CertificateControllerTest (PR #110) | ☐ Pass ☐ Fail |
| **TC-22** Đánh giá khóa học | Student đã mua khóa | Mở Đánh giá → chọn 1–5 sao và nhận xét → Gửi; sửa; xóa. Thử với khóa chưa mua | Đã mua: gửi/sửa/xóa được và điểm trung bình cập nhật; chưa mua: bị chặn | ReviewControllerTest · WishlistAndReview.test.js | ☐ Pass ☐ Fail |
| **TC-23** Hỏi đáp dưới bài học | Student đã mua; instructor là chủ khóa | Student đặt câu hỏi dưới một bài; instructor trả lời và đánh dấu câu trả lời được chấp nhận | Câu hỏi hiện dưới đúng bài; giảng viên nhận thông báo; chỉ một câu trả lời được chấp nhận; người ngoài khóa bị chặn | QuestionAnswerControllerTest (giao diện: PR #102) | ☐ Pass ☐ Fail |
| **TC-24** Thông báo trong app | Có thông báo (ví dụ khóa được duyệt) | Mở màn Thông báo; bấm đánh dấu đã đọc | Danh sách thông báo, nhãn chưa đọc, đánh dấu đã đọc cập nhật tức thì; trạng thái trống/lỗi hiển thị đúng | AdminCourseReviewControllerTest · NotificationsScreen.test.js | ☐ Pass ☐ Fail |
| **TC-25** (Stretch) Thanh toán VNPay | Đã merge #95; backend bật `vnpay` + tài khoản sandbox | Checkout → Thanh toán qua VNPay → trả bằng thẻ test → quay về app; thử sửa một tham số trên URL Return | Thanh toán thành công thì đơn PAID, có Enrollment và khóa trong Khóa học của tôi; sai checksum bị từ chối (đơn vẫn PENDING) | VnpayGatewayTest · VnpayPaymentFlowTest (PR #111); sandbox thật chưa kiểm chứng | ☐ Pass ☐ Fail |

### 2.3. Giảng viên (INSTRUCTOR)

| ID | Tiền điều kiện | Các bước | Kết quả mong đợi | Tự động | APK |
| --- | --- | --- | --- | --- | --- |
| **TC-26** Tạo khóa học | Đăng nhập instructor | Góc giảng viên → tạo khóa: tiêu đề, mô tả, danh mục, giá | Khóa mới ở trạng thái DRAFT trong My Courses; lọc theo trạng thái hoạt động | InstructorCourseControllerTest · InstructorScreens.test.js | ☐ Pass ☐ Fail |
| **TC-27** Giáo trình và upload video | Có khóa DRAFT | Thêm chương và bài; sắp xếp lại; xóa một bài; upload video từ máy | Thứ tự lưu đúng; video lên Cloudinary có thanh tiến trình, bài lưu link và thời lượng | InstructorSectionLessonControllerTest · InstructorCourseControllerTest (chữ ký upload) | ☐ Pass ☐ Fail |
| **TC-28** Gửi duyệt | Khóa DRAFT | (a) Gửi duyệt khi chưa có chương hoặc video<br>(b) Bổ sung đủ rồi gửi duyệt | (a) bị từ chối kèm lý do; (b) chuyển sang PENDING | InstructorSectionLessonControllerTest | ☐ Pass ☐ Fail |
| **TC-29** Phân quyền giảng viên | Đăng nhập student / instructor | (a) Student gọi API `/api/instructor/**`<br>(b) Instructor thử vào khu vực Admin | (a) 403; (b) bị chặn hoặc chuyển về khu vực của mình | InstructorCourseControllerTest · RoleLayout.test.js | ☐ Pass ☐ Fail |

### 2.4. Quản trị viên (ADMIN)

| ID | Tiền điều kiện | Các bước | Kết quả mong đợi | Tự động | APK |
| --- | --- | --- | --- | --- | --- |
| **TC-30** Duyệt khóa học | Có khóa PENDING | Quản trị → Hàng chờ duyệt → xem chi tiết (giáo trình, video) → Duyệt (có xác nhận) | Khóa chuyển PUBLISHED, xuất hiện ở catalog học viên; giảng viên nhận thông báo; khóa không còn trong hàng chờ | AdminCourseReviewControllerTest · ReviewQueueScreen.test.js | ☐ Pass ☐ Fail |
| **TC-31** Từ chối và sửa lại | Có khóa PENDING khác | Admin Từ chối: (a) để trống lý do, (b) nhập lý do. Instructor mở khóa bị từ chối | (a) không cho từ chối; (b) khóa REJECTED, giảng viên thấy lý do trong thông báo, sửa và gửi duyệt lại được | AdminCourseReviewControllerTest · ReviewQueueScreen.test.js | ☐ Pass ☐ Fail |
| **TC-32** Quản lý người dùng | Có nhiều tài khoản | Tìm kiếm/lọc theo vai trò; cuộn phân trang; Khóa một tài khoản rồi thử đăng nhập; Mở khóa; thử khóa chính mình | Danh sách đúng; tài khoản bị khóa không đăng nhập được kể cả khi đang có phiên; mở khóa thì dùng lại được; không khóa được chính mình | AdminUserControllerTest · AuthControllerTest · UserManagementScreen.test.js | ☐ Pass ☐ Fail |
| **TC-33** Quản lý danh mục | Đăng nhập admin | Tạo, sửa danh mục; xóa danh mục đang có khóa học; xóa danh mục trống | Tạo/sửa đồng bộ sang bộ lọc catalog; xóa danh mục đang có khóa bị từ chối (409); xóa danh mục trống thành công | AdminCategoryControllerTest · CategoryManagementScreen.test.js | ☐ Pass ☐ Fail |

## 3. Kết quả chạy tự động (bằng chứng cột "Tự động")

Chạy ngày **2026-11-16** trên `develop` tại commit `ce57479`:

| Bộ test | Lệnh | Kết quả |
| --- | --- | --- |
| Backend (JUnit, MockMvc, H2) | `cd backend && ./mvnw -B clean test` | **86 test, 0 lỗi, 0 bỏ qua — PASS** |
| Mobile (Jest) | `cd mobile && npx jest --runInBand` | **70 test PASS** trong 12/14 suite. 2 suite (`UserManagementScreen`, `NotificationsScreen`) **không chạy được trên máy này** (lỗi môi trường Jest: `The "path" argument must be of type string`, tái hiện cả trên `develop` sạch); kết quả của hai suite này lấy từ CI |

Các test của #73, #74, #75, #95 nằm trên nhánh của từng PR (#107, #108, #110, #111) và chỉ tính sau khi được merge; kết quả chạy ở mô tả từng PR.
Test tự động chứng minh logic API và màn hình; **không thay thế** việc chạy tay trên APK (video thật, xoay màn hình, tắt app, chia sẻ file, mở trình duyệt…).

## 4. Tổng hợp kết quả trên APK

Điền sau khi cả nhóm chạy xong. Chỉ ghi "Đạt" khi mọi case trong nhóm đều Pass.

| Nhóm | Số case | Pass | Fail | Chưa chạy | Đạt |
| --- | :---: | :---: | :---: | :---: | :---: |
| Chung (TC-01 → TC-07) | 7 | | | 7 | |
| Học viên (TC-08 → TC-25) | 18 | | | 18 | |
| Giảng viên (TC-26 → TC-29) | 4 | | | 4 | |
| Quản trị (TC-30 → TC-33) | 4 | | | 4 | |
| **Tổng** | **33** | | | **33** | |

Bug phát hiện khi chạy: ghi vào issue `type:bug` và liên kết trong task list của #97 (Learning) hoặc issue Fix bug của module tương ứng (#88, #91, #94).
