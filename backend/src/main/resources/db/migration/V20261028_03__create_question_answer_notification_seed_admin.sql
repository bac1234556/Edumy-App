-- ==========================================================
-- Flyway Migration: V20261028_03__create_question_answer_notification_seed_admin.sql
-- Module: Admin & Community (Member E - Issue #16)
-- Scope:
--   1. Tạo bảng questions
--   2. Tạo bảng answers
--   3. Tạo bảng notifications
--   4. Seed tài khoản Admin mặc định (mật khẩu BCrypt từ biến môi trường ADMIN_PASSWORD_HASH)
-- ==========================================================

-- 1. Table: questions
CREATE TABLE IF NOT EXISTS `questions` (
    `id`         BIGINT AUTO_INCREMENT PRIMARY KEY,
    `lesson_id`  BIGINT       NOT NULL,
    `user_id`    BIGINT       NOT NULL,
    `content`    TEXT         NOT NULL,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_questions_lesson_id` (`lesson_id`),
    INDEX `idx_questions_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: answers
CREATE TABLE IF NOT EXISTS `answers` (
    `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
    `question_id` BIGINT       NOT NULL,
    `user_id`     BIGINT       NOT NULL,
    `content`     TEXT         NOT NULL,
    `is_accepted` BOOLEAN      NOT NULL DEFAULT FALSE,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_answers_question_id` (`question_id`),
    INDEX `idx_answers_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: notifications
CREATE TABLE IF NOT EXISTS `notifications` (
    `id`         BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id`    BIGINT       NOT NULL,
    `type`       VARCHAR(50)  NOT NULL COMMENT 'COURSE_APPROVED | COURSE_REJECTED | NEW_ANSWER | NEW_ENROLLMENT',
    `title`      VARCHAR(255) NOT NULL,
    `body`       TEXT         NOT NULL,
    `is_read`    BOOLEAN      NOT NULL DEFAULT FALSE,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notifications_user_id` (`user_id`),
    INDEX `idx_notifications_is_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: users (nếu chưa được tạo bởi module Auth)
CREATE TABLE IF NOT EXISTS `users` (
    `id`            BIGINT AUTO_INCREMENT PRIMARY KEY,
    `email`         VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name`     VARCHAR(100) NOT NULL,
    `avatar_url`    VARCHAR(255) DEFAULT NULL,
    `role`          VARCHAR(20)  NOT NULL DEFAULT 'STUDENT',
    `status`        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    `bio`           TEXT         DEFAULT NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seed: Admin account
-- Mật khẩu mặc định demo: "Admin@123456" (BCrypt hash) dùng cho môi trường demo/staging.
-- Production: thay hash bằng biến môi trường ADMIN_PASSWORD_HASH khi chạy Docker.
-- Hash bên dưới tương ứng với password "Admin@123456"
INSERT INTO `users`
    (`email`, `password_hash`, `full_name`, `role`, `status`, `bio`, `created_at`, `updated_at`)
VALUES
    (
        'admin@edumy.vn',
        '$2a$12$tuKF7t9/2TSLLDLAqz5SJeuBWRthVPt6kWpHLJ6nItFRuTG.T0.PO',
        'Quản trị viên Edumy',
        'ADMIN',
        'ACTIVE',
        'Tài khoản quản trị hệ thống Edumy Platform.',
        NOW(),
        NOW()
    )
ON DUPLICATE KEY UPDATE
    `password_hash` = VALUES(`password_hash`),
    `full_name`     = VALUES(`full_name`),
    `status`        = VALUES(`status`),
    `updated_at`    = NOW();
