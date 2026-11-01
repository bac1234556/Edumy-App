-- ==========================================================
-- Flyway Migration: V20261027_02__create_category_wishlist_review.sql
-- Module: Catalog & Review (Member B - Issue #7)
-- ==========================================================

-- 1. Table: categories
CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL UNIQUE,
    `icon` VARCHAR(100) DEFAULT NULL,
    `description` VARCHAR(500) DEFAULT NULL,
    `parent_id` BIGINT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_categories_slug` (`slug`),
    INDEX `idx_categories_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Seed 6 core categories
INSERT INTO `categories` (`name`, `slug`, `icon`, `description`) VALUES
('Lập trình & CNTT', 'lap-trinh-cntt', 'code-tags', 'Các khóa học phát triển phần mềm, web, mobile, AI và hạ tầng Cloud.'),
('Thiết kế đồ họa & UI/UX', 'thiet-ke-do-hoa', 'palette', 'Thiết kế giao diện ứng dụng Figma, đồ họa quảng cáo Photoshop, Illustrator.'),
('Kinh doanh & Khởi nghiệp', 'kinh-doanh-khoi-nghiep', 'briefcase', 'Kỹ năng quản trị doanh nghiệp, bán hàng, đầu tư tài chính và khởi nghiệp.'),
('Marketing & Truyền thông', 'marketing-truyen-thong', 'bullhorn', 'Digital marketing, SEO, Facebook/Google Ads, sáng tạo nội dung mạng xã hội.'),
('Ngoại ngữ', 'ngoai-ngu', 'translate', 'Tiếng Anh giao tiếp, luyện thi TOEIC, IELTS, tiếng Nhật, tiếng Trung và tiếng Hàn.'),
('Phát triển bản thân', 'phat-trien-ban-than', 'school', 'Kỹ năng thuyết trình, giao tiếp, quản lý thời gian và tư duy phản biện.')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. Table: wishlists
CREATE TABLE IF NOT EXISTS `wishlists` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `course_id` BIGINT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_wishlist_user_course` (`user_id`, `course_id`),
    INDEX `idx_wishlists_user_id` (`user_id`),
    INDEX `idx_wishlists_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: reviews
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `course_id` BIGINT NOT NULL,
    `rating` TINYINT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
    `comment` TEXT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_review_user_course` (`user_id`, `course_id`),
    INDEX `idx_reviews_course_id` (`course_id`),
    INDEX `idx_reviews_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
