# Sơ đồ Cơ sở Dữ liệu Tổng thể (ERD) - Edumy App

> **Mã công việc:** W7-T1  
> **Phiên bản:** v1.0 (Khóa theo Kickoff D1)  
> **File DBML nguồn:** [`erd.dbml`](file:///C:/Users/bacle/.gemini/antigravity-ide/scratch/Edumy-App/docs/erd.dbml) (Dùng để import trực tiếp vào [dbdiagram.io](https://dbdiagram.io))  
> **Ảnh sơ đồ trực quan:** [`erd.png`](file:///C:/Users/bacle/.gemini/antigravity-ide/scratch/Edumy-App/docs/erd.png)

---

## 1. Sơ đồ Quan hệ Thực thể (Mermaid ERD)

```mermaid
erDiagram
    USERS ||--o{ COURSES : "creates / teaches"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ ENROLLMENTS : "registers"
    USERS ||--o{ REVIEWS : "writes"
    USERS ||--o{ WISHLISTS : "saves"
    USERS ||--o{ QUESTIONS : "asks"
    USERS ||--o{ ANSWERS : "replies"
    USERS ||--o{ NOTIFICATIONS : "receives"

    CATEGORIES ||--o{ COURSES : "classifies"
    CATEGORIES ||--o{ CATEGORIES : "parent / child"

    COURSES ||--|{ SECTIONS : "contains"
    COURSES ||--o{ REVIEWS : "rated in"
    COURSES ||--o{ WISHLISTS : "bookmarked in"
    COURSES ||--o{ ORDERS : "purchased in"
    COURSES ||--o{ ENROLLMENTS : "subscribed to"

    SECTIONS ||--|{ LESSONS : "groups"

    LESSONS ||--o{ LESSON_PROGRESS : "tracked in"
    LESSONS ||--o{ QUESTIONS : "discussed in"

    ORDERS ||--o| ENROLLMENTS : "fulfills"

    ENROLLMENTS ||--|{ LESSON_PROGRESS : "records"
    ENROLLMENTS ||--o| CERTIFICATES : "awarded with"

    QUESTIONS ||--o{ ANSWERS : "answered by"

    USERS {
        bigint id PK
        string email UK
        string password_hash
        string full_name
        string avatar_url
        string role "STUDENT | INSTRUCTOR | ADMIN"
        string status "ACTIVE | LOCKED"
        string bio
        datetime created_at
        datetime updated_at
    }

    CATEGORIES {
        bigint id PK
        string name
        string slug UK
        string icon
        string description
        bigint parent_id FK
        datetime created_at
    }

    COURSES {
        bigint id PK
        bigint instructor_id FK
        bigint category_id FK
        string title
        string subtitle
        string description
        string thumbnail_url
        decimal price
        string level "BEGINNER | INTERMEDIATE | ADVANCED"
        string status "DRAFT | PENDING | PUBLISHED | REJECTED"
        string rejection_reason
        int total_duration_seconds
        datetime created_at
    }

    SECTIONS {
        bigint id PK
        bigint course_id FK
        string title
        int order_index
        datetime created_at
    }

    LESSONS {
        bigint id PK
        bigint section_id FK
        string title
        string video_url
        string video_public_id
        int duration_seconds
        boolean is_preview
        int order_index
        datetime created_at
    }

    ORDERS {
        bigint id PK
        bigint user_id FK
        bigint course_id FK
        decimal amount
        string status "PENDING | PAID | FAILED"
        string payment_method "MOCK | VNPAY"
        string txn_ref UK
        datetime paid_at
        datetime created_at
        datetime updated_at
    }

    ENROLLMENTS {
        bigint id PK
        bigint user_id FK
        bigint course_id FK
        bigint order_id FK "NULL nếu khóa miễn phí"
        int progress_percent "0..100"
        datetime completed_at
        datetime created_at
        datetime updated_at
    }

    LESSON_PROGRESS {
        bigint id PK
        bigint enrollment_id FK
        bigint lesson_id FK
        int last_position_sec
        boolean completed
        datetime completed_at
        datetime created_at
        datetime updated_at
    }

    REVIEWS {
        bigint id PK
        bigint user_id FK
        bigint course_id FK
        tinyint rating "1..5"
        string comment
        datetime created_at
    }

    WISHLISTS {
        bigint id PK
        bigint user_id FK
        bigint course_id FK
        datetime created_at
    }

    CERTIFICATES {
        bigint id PK
        bigint enrollment_id FK, UK
        string code UK
        datetime issued_at
        string pdf_url
    }

    QUESTIONS {
        bigint id PK
        bigint lesson_id FK
        bigint user_id FK
        string title
        string content
        datetime created_at
    }

    ANSWERS {
        bigint id PK
        bigint question_id FK
        bigint user_id FK
        string content
        boolean is_accepted_by_instructor
        datetime created_at
    }

    NOTIFICATIONS {
        bigint id PK
        bigint user_id FK
        string title
        string content
        string type "COURSE_APPROVED | REJECTED | NEW_ANSWER"
        bigint reference_id
        boolean is_read
        datetime created_at
    }
```

---

## 2. Từ điển Dữ liệu Chi tiết (Data Dictionary)

### 2.1. Phân hệ Người dùng & Xác thực (Member A)
* **`users`**:
  * `id`: Khóa chính (Auto Increment).
  * `email`: Email đăng nhập duy nhất (`UNIQUE`, `NOT NULL`).
  * `password_hash`: Chuỗi mật khẩu băm BCrypt.
  * `role`: Phân quyền người dùng (`STUDENT`, `INSTRUCTOR`, `ADMIN`).
  * `status`: Trạng thái kích hoạt (`ACTIVE`, `LOCKED` khi bị Admin xử lý).

### 2.2. Phân hệ Danh mục, Khóa học & Đánh giá (Member B)
* **`categories`**: Quản lý cây danh mục (hỗ trợ `parent_id` cho danh mục con).
* **`courses`**:
  * `status`: Quản lý vòng đời xuất bản: `DRAFT` (mới tạo) $\rightarrow$ `PENDING` (chờ duyệt) $\rightarrow$ `PUBLISHED` (đã duyệt, hiển thị Catalog) hoặc `REJECTED` (bị từ chối kèm `rejection_reason`).
  * `price`: Giá bán (0.00 là khóa học miễn phí).
* **`wishlists`**: Danh sách lưu yêu thích (ràng buộc unique `[user_id, course_id]`).
* **`reviews`**: Đánh giá 1-5 sao và nhận xét (chỉ cho phép khi người dùng đã enroll).

### 2.3. Phân hệ Giảng trình & Bài học Video (Member C)
* **`sections`**: Chương học trong khóa, sắp xếp theo `order_index`.
* **`lessons`**:
  * `video_url`: Đường dẫn stream video từ Cloudinary.
  * `video_public_id`: ID quản lý asset trên Cloudinary để phục vụ xóa/thay thế.
  * `duration_seconds`: Thời lượng video tính bằng giây.
  * `is_preview`: Cờ cho phép học viên chưa mua xem thử (Preview lesson).

### 2.4. Phân hệ Đơn hàng, Học tập & Chứng chỉ (Member D)
> Cập nhật theo W7-D1 (Issue #13), migration `V20261102_10__create_order_enrollment_progress_certificate.sql`.

* **`orders`**: Ghi nhận giao dịch mua khóa học.
  * `amount`: Số tiền thanh toán tại thời điểm mua (`DECIMAL(12,2)`, `>= 0`).
  * `status`: `PENDING` $\rightarrow$ `PAID` hoặc `FAILED`.
  * `payment_method`: `MOCK` hoặc `VNPAY`.
  * `txn_ref`: Mã tham chiếu duy nhất gửi sang cổng thanh toán (`vnp_TxnRef`), dùng để đối soát callback.
  * `paid_at`: Thời điểm thanh toán thành công.
* **`enrollments`**: Xác nhận quyền học. Một học viên chỉ có 1 bản ghi cho mỗi khóa học (`UNIQUE(user_id, course_id)`).
  * `order_id`: Đơn hàng tạo ra quyền học (`NULL` với khóa miễn phí, `SET NULL` khi xóa đơn).
  * `progress_percent`: Tiến độ 0–100 (CHECK), tính từ số bài đã hoàn thành.
  * `completed_at`: Thời điểm hoàn thành toàn bộ khóa.
* **`lesson_progress`**: Tiến độ xem từng bài học (`UNIQUE(enrollment_id, lesson_id)`).
  * `last_position_sec`: Vị trí xem gần nhất (giây) để tiếp tục phát.
  * `completed`: Tự động chuyển `true` khi xem $\ge 90\%$; `completed_at` ghi thời điểm đó.
* **`certificates`**: Cấp khi toàn bộ bài học trong khóa đều `completed = true`; mỗi enrollment tối đa 1 chứng chỉ (`UNIQUE(enrollment_id)`).
  * `code`: Mã duy nhất định dạng `EDUMY-<YEAR>-<RANDOM>`, tra cứu công khai.
  * `issued_at`, `pdf_url`: Ngày cấp và đường dẫn file PDF.

### 2.5. Phân hệ Quản trị & Hỏi đáp Cộng đồng (Member E)
* **`questions`**: Thắc mắc của học viên gắn với từng bài học cụ thể.
* **`answers`**: Lời giải đáp từ cộng đồng hoặc giảng viên. Giảng viên có quyền tick `is_accepted_by_instructor = true`.
* **`notifications`**: Thông báo trong app khi khóa học được duyệt, bị từ chối hoặc có phản hồi câu hỏi.

---

## 3. Quy ước Đặt tên & Migration (Flyway)
1. Bảng dùng danh từ số nhiều, viết thường theo kiểu `snake_case` (`users`, `courses`, `lesson_progress`).
2. Khóa chính luôn là `id BIGINT AUTO_INCREMENT`.
3. Khóa ngoại đặt tên theo thực thể cha: `<singular_table_name>_id` (ví dụ `course_id`, `user_id`).
4. Toàn bộ file migration trong Spring Boot lưu tại `/backend/src/main/resources/db/migration/` và đặt tên theo timestamp chuẩn để không xung đột:  
   `V20261027_01__create_users.sql`, `V20261027_02__create_courses.sql`...
