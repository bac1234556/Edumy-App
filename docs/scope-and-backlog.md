# Tài liệu Khóa Scope MVP & Quản lý Backlog Dự án Edumy

> **Mã công việc:** W7-T1  
> **Thời điểm khóa scope:** Ngày 27/10/2026 (D1 - Tuần 7)  
> **Áp dụng cho:** Cả nhóm 5 thành viên (Member A, B, C, D, E)  
> **Nguyên tắc:** Bất biến về phạm vi cốt lõi, mọi ý tưởng phát sinh bắt buộc chuyển vào danh sách Backlog.

---

## 1. Mục tiêu và Nguyên tắc Khóa Scope

Dự án **Edumy** triển khai trong khung thời gian cố định **4 tuần (28 ngày, từ D1 đến D28)** với mục tiêu bàn giao một sản phẩm học trực tuyến Android hoàn chỉnh, ổn định và có thể demo luồng nghiệp vụ khép kín (Happy Path):
$$\text{Giảng viên đăng khóa} \longrightarrow \text{Admin duyệt khóa} \longrightarrow \text{Học viên mua và học video} \longrightarrow \text{Hỏi đáp & Nhận chứng chỉ}$$

Để bảo đảm dự án về đích đúng hạn vào ngày D28 mà không bị trễ hạn hoặc quá tải kỹ thuật, nhóm thống nhất áp dụng nguyên tắc **Scope Triaging**:
1. **P0 (Must-Have - MVP):** Bắt buộc hoàn thành trước cuối Tuần 8 (D14). Không cắt giảm.
2. **P1 (Should-Have - Extended):** Hoàn thành trong Tuần 9 (trước mốc **Feature Freeze D21**).
3. **P2 (Nice-to-Have - Stretch):** Chỉ thực hiện trong Tuần 10 (D22 - D24) nếu P0 và P1 đã hoàn toàn ổn định và vượt qua kiểm thử.
4. **Out-of-Scope:** Nghiêm cấm triển khai trong phạm vi 4 tuần để bảo toàn nguồn lực.

---

## 2. Ma trận Phân loại Tính năng (Feature Matrix)

### 2.1. Nhóm MVP (Cốt lõi - Bắt buộc)

| STT | Phân hệ / Module | Tính năng chi tiết | Thành viên phụ trách | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Auth & Account** | Đăng ký, Đăng nhập (JWT access + refresh token), phân quyền 3 role: `STUDENT`, `INSTRUCTOR`, `ADMIN` | **Member A** | Đăng nhập thành công, lưu token vào AsyncStorage/SecureStore, tự động chuyển đúng tab theo role. |
| 2 | **Profile** | Xem và cập nhật thông tin cá nhân (Họ tên, Bio, Avatar) | **Member A** | Cập nhật phản ánh ngay lên UI và database. |
| 3 | **Catalog & Search** | Trang chủ (Banner, danh mục nổi bật, khóa học mới nhất, bán chạy) | **Member B** | Hiển thị danh sách khóa học với hình ảnh, giá, giảng viên, phân trang mượt mà. |
| 4 | **Filter & Discovery** | Tìm kiếm theo từ khóa, lọc theo danh mục, mức giá (Miễn phí / Trả phí), cấp độ, sắp xếp | **Member B** | API JPA Specification trả kết quả chính xác, mobile có debounce search. |
| 5 | **Course Detail** | Màn hình chi tiết khóa học, thông tin tổng quan, curriculum outline, xem thử bài preview | **Member B** | Hiển thị danh sách section/lesson, bấm xem được video preview miễn phí. |
| 6 | **Wishlist** | Thêm/Xóa khóa học vào danh sách yêu thích | **Member B** | Lưu trữ trên database, toggle icon trái tim cập nhật tức thì. |
| 7 | **Instructor Studio** | Quản lý danh sách khóa học của tôi (My Courses) với các trạng thái `DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED` | **Member C** | Lọc theo trạng thái, hiển thị lý do từ chối nếu bị reject. |
| 8 | **Course Builder** | Tạo và chỉnh sửa thông tin cơ bản của khóa học (Tiêu đề, mô tả, danh mục, giá, thumbnail) | **Member C** | Upload thumbnail lên Cloudinary thành công, lưu database. |
| 9 | **Curriculum Editor** | Thêm/Sửa/Xóa Section và Lesson; Upload video bài học kèm tiến trình | **Member C** | Upload video trực tiếp từ máy Android lên Cloudinary qua signed params, lưu `video_url`, `duration`. |
| 10 | **Submit Course** | Gửi khóa học vào hàng chờ duyệt (chuyển trạng thái `DRAFT` $\rightarrow$ `PENDING`) | **Member C** | Khóa học chỉ được gửi duyệt khi có ít nhất 1 section và 1 lesson có video. |
| 11 | **Checkout & Order** | Tạo đơn hàng (`Order` PENDING $\rightarrow$ PAID), Mock Checkout cho khóa học có phí, Enroll trực tiếp khóa 0đ | **Member D** | Đơn hàng tạo thành công trong DB, kích hoạt bản ghi `Enrollment` ngay khi thanh toán. |
| 12 | **My Learning** | Danh sách khóa học đã đăng ký của học viên, tiến độ tổng quan (%) | **Member D** | Phân loại rõ: Đang học / Đã hoàn thành. |
| 13 | **Video Player** | Trình phát video bài học sử dụng `expo-video`, danh sách bài giảng bên cạnh/bên dưới | **Member D** | Phát video mượt từ link Cloudinary, tự động đánh dấu hoàn thành khi xem $\ge 90\%$. |
| 14 | **Admin Review Queue** | Hàng chờ duyệt khóa học: Xem chi tiết nội dung, Duyệt (`Approve`) hoặc Từ chối (`Reject` kèm lý do) | **Member E** | Khóa học duyệt xong lập tức xuất hiện trên Catalog học viên; từ chối thì giảng viên thấy lý do sửa lại. |
| 15 | **User Management** | Quản lý danh sách người dùng, Khóa (`Lock`) / Mở khóa (`Unlock`) tài khoản | **Member E** | Tài khoản bị khóa sẽ không thể đăng nhập hoặc thao tác API. |
| 16 | **Category CRUD** | Quản lý danh mục khóa học (Tạo, Sửa, Xóa danh mục cha/con kèm icon) | **Member E** | Cập nhật danh mục được đồng bộ tức thì sang Catalog. |

---

### 2.2. Nhóm Tính năng Mở rộng (Extended - Hoàn thành Tuần 9)

| STT | Phân hệ / Module | Tính năng chi tiết | Thành viên phụ trách | Ghi chú & Ràng buộc |
| :---: | :--- | :--- | :---: | :--- |
| 17 | **Reviews & Ratings** | Đánh giá số sao (1-5 sao) và viết nhận xét sau khi học khóa học | **Member B** | Ràng buộc nghiệp vụ: Chỉ học viên đã enroll mới được đánh giá (mỗi người 1 đánh giá/khóa học). |
| 18 | **Q&A Discussion** | Hỏi đáp trực tiếp dưới từng bài học video: đặt câu hỏi, phản hồi trao đổi giữa học viên & giảng viên | **Member E** | Giảng viên có quyền đánh dấu câu trả lời "Hữu ích / Đúng nhất". |
| 19 | **Certificate PDF** | Tự động sinh và xuất Chứng chỉ hoàn thành khóa học dưới định dạng PDF có mã xác thực | **Member D** | Sinh bằng OpenPDF trên Backend khi tiến độ đạt 100%, có mã tra cứu duy nhất. |
| 20 | **Dashboard Analytics** | Biểu đồ thống kê số liệu tăng trưởng cho Instructor (học viên, doanh thu) & Admin (tổng quan hệ thống) | **Member E** (Admin) & **Member C** (Instructor) | Hiển thị các chỉ số KPI trực quan trên mobile. |
| 21 | **In-app Notification** | Thông báo khi khóa học được duyệt/từ chối, khi có phản hồi Q&A mới | **Member E** | Bản ghi thông báo lưu DB, có đánh dấu đã đọc/chưa đọc. |

---

### 2.3. Nhóm Tính năng Giãn (Stretch - Tuần 10)

| STT | Tính năng | Điều kiện kích hoạt | Phương án dự phòng |
| :---: | :--- | :--- | :--- |
| 22 | **Cổng thanh toán VNPay Sandbox** | Chỉ thực hiện trong D22 - D24 nếu toàn bộ tính năng P0 + P1 không còn lỗi nghiêm trọng (Zero High/Critical bugs). | Giữ nguyên chế độ Mock Checkout làm mặc định; đóng gói VNPay dưới dạng tính năng thử nghiệm. |

---

### 2.4. Phân định Out-of-Scope (Tuyệt đối không làm trong 4 tuần)

Nhóm thống nhất loại bỏ các tính năng sau khỏi phạm vi đồ án để tránh phình to scope (Scope Creep):
- **Ứng dụng iOS:** Chỉ tập trung tối ưu 100% trên nền tảng Android.
- **Livestream / Lớp học trực tuyến:** Tốn tài nguyên media server, không phù hợp mô hình khóa học thu sẵn.
- **Nhắn tin trò chuyện thời gian thực (Chat 1-1):** Đã có phân hệ Q&A theo bài giảng thay thế đầy đủ nhu cầu tương tác.
- **Tải video ngoại tuyến (Offline DRM):** Yêu cầu mã hóa video native phức tạp, Cloudinary free tier không hỗ trợ DRM.
- **Giỏ hàng nhiều khóa học (Shopping Cart):** Mỗi giao dịch thực hiện thanh toán trực tiếp cho 1 khóa học (Instant Checkout) nhằm tinh gọn luồng dữ liệu.
- **Đăng nhập mạng xã hội (Google / Facebook OAuth2):** Đòi hỏi đăng ký app console, cấu hình SHA-1 native phức tạp; nhóm tập trung làm chuẩn xác JWT email/password.
- **Đa ngôn ngữ (i18n):** Ưu tiên giao diện tiếng Việt thân thiện, chuẩn xác.

---

## 3. Backlog Ý Tưởng Mới & Quy Trình Sàng Lọc

Mọi ý tưởng mới xuất hiện trong quá trình làm việc phải được đưa ngay vào bảng dưới đây và **không được trực tiếp code** nếu chưa được Tech Lead và nhóm đồng thuận thông qua sau mốc Feature Freeze D21.

### 3.1. Danh sách Backlog (Future Roadmap)

| Mã ID | Tên ý tưởng | Phân hệ gợi ý | Độ ưu tiên | Ghi chú kỹ thuật |
| :---: | :--- | :---: | :---: | :--- |
| **BK-01** | Trắc nghiệm Quiz có chấm điểm tự động | Learning / Instructor | Medium | Tạo bảng `quizzes`, `quiz_questions`, `quiz_submissions`. Chấm điểm và yêu cầu đạt $\ge 80\%$ để hoàn thành bài. |
| **BK-02** | Mã giảm giá / Coupon khuyến mãi | Order / Marketing | Medium | Giảng viên tạo coupon với hạn sử dụng và % giảm giá. Áp dụng tại màn hình Checkout. |
| **BK-03** | Ghi chú video có gắn timestamp (Notes) | Player | Low | Cho phép học viên lưu note ở giây thứ X của video, bấm vào note nhảy đến thời điểm đó. |
| **BK-04** | Báo cáo vi phạm nội dung (Report) | Admin | Low | Học viên gắn cờ bài học/khóa học vi phạm; Admin có màn hình xử lý khiếu nại. |
| **BK-05** | Chính sách hoàn tiền tự động (Refund Flow) | Order / Admin | Low | Yêu cầu hoàn tiền trong vòng 7 ngày nếu chưa học quá 20% thời lượng. |
| **BK-06** | Dark Mode toàn ứng dụng | Mobile UI | Low | Tận dụng theme engine của React Native Paper. |

### 3.2. Quy trình xử lý yêu cầu thay đổi (Scope Change Process)
1. Thành viên phát hiện ý tưởng mới hoặc vấn đề kỹ thuật cần bổ sung tính năng $\rightarrow$ Tạo Issue trên GitHub gán nhãn `type:feature` và `backlog`.
2. Trong buổi Daily Standup buổi tối, Tech Lead (Member A) đánh giá mức độ ảnh hưởng đến deadline D28.
3. Nếu tính năng thuộc diện P0/P1 bị vướng: Ưu tiên áp dụng giải pháp tối giản nhất (simplest working solution).
4. Nghiêm cấm tự ý bổ sung trường cơ sở dữ liệu hoặc API ngoài hợp đồng đã thỏa thuận tại D1.
