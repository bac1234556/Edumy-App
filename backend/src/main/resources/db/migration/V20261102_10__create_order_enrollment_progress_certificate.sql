-- ==========================================================
-- Flyway Migration: V20261102_10__create_order_enrollment_progress_certificate.sql
-- Module: Enrollment, Learning & Certificate (Member D - Issue #13 / W7-D1)
-- Scope:
--   1. orders          : đơn mua khóa học (MOCK / VNPAY), txn_ref là mã tham chiếu gửi cổng thanh toán
--   2. enrollments     : quyền học, unique (user_id, course_id), progress_percent 0..100
--   3. lesson_progress : vị trí xem gần nhất và cờ hoàn thành của từng bài
--   4. certificates    : 1 chứng chỉ / enrollment, code tra cứu công khai
-- Kiểu cột bám theo các migration đã chạy với Hibernate validate (ENUM, DATETIME(6), BIT(1)).
-- ==========================================================

-- 1. Table: orders
CREATE TABLE orders (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT        NOT NULL,
    course_id      BIGINT        NOT NULL,
    amount         DECIMAL(12,2) NOT NULL DEFAULT 0,
    status         ENUM('PENDING','PAID','FAILED') NOT NULL DEFAULT 'PENDING',
    payment_method ENUM('MOCK','VNPAY') NOT NULL DEFAULT 'MOCK',
    txn_ref        VARCHAR(64)   NOT NULL,
    paid_at        DATETIME(6)   NULL,
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_orders_txn_ref UNIQUE (txn_ref),
    CONSTRAINT chk_orders_amount CHECK (amount >= 0),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_orders_user_id (user_id),
    INDEX idx_orders_course_id (course_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: enrollments
CREATE TABLE enrollments (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT      NOT NULL,
    course_id        BIGINT      NOT NULL,
    order_id         BIGINT      NULL COMMENT 'NULL với khóa miễn phí',
    progress_percent INT         NOT NULL DEFAULT 0,
    completed_at     DATETIME(6) NULL,
    created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_enrollments_user_course UNIQUE (user_id, course_id),
    CONSTRAINT chk_enrollments_progress CHECK (progress_percent BETWEEN 0 AND 100),
    CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_enrollments_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: lesson_progress
CREATE TABLE lesson_progress (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id     BIGINT      NOT NULL,
    lesson_id         BIGINT      NOT NULL,
    last_position_sec INT         NOT NULL DEFAULT 0,
    completed         BIT(1)      NOT NULL DEFAULT b'0',
    completed_at      DATETIME(6) NULL,
    created_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_lesson_progress_enrollment_lesson UNIQUE (enrollment_id, lesson_id),
    CONSTRAINT chk_lesson_progress_position CHECK (last_position_sec >= 0),
    CONSTRAINT fk_lesson_progress_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    INDEX idx_lesson_progress_lesson_id (lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: certificates
CREATE TABLE certificates (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT       NOT NULL,
    code          VARCHAR(50)  NOT NULL COMMENT 'EDUMY-<YEAR>-<RANDOM>',
    issued_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    pdf_url       VARCHAR(500) NULL,
    CONSTRAINT uk_certificates_enrollment UNIQUE (enrollment_id),
    CONSTRAINT uk_certificates_code UNIQUE (code),
    CONSTRAINT fk_certificates_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
