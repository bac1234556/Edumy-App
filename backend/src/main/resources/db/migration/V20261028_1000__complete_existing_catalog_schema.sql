-- Minimal schema required by Course/Section/Lesson entities already on develop.
-- No new API, authentication, seed course content, or changes to earlier migrations.
CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    instructor_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(300),
    description LONGTEXT,
    thumbnail_url VARCHAR(500),
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    level ENUM('BEGINNER','INTERMEDIATE','ADVANCED','ALL_LEVELS') NOT NULL DEFAULT 'ALL_LEVELS',
    status ENUM('DRAFT','PENDING','PUBLISHED','REJECTED') NOT NULL DEFAULT 'DRAFT',
    rejection_reason TEXT,
    total_duration_seconds INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lessons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    section_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(500),
    video_public_id VARCHAR(255),
    duration_seconds INT NOT NULL DEFAULT 0,
    is_preview BIT(1) NOT NULL DEFAULT b'0',
    order_index INT NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
