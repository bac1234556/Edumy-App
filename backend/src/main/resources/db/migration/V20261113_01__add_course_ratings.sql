-- ==========================================================
-- Flyway Migration: V20261113_01__add_course_ratings.sql
-- Module: Catalog & Review (Issue #68 - W9-B2)
-- ==========================================================

ALTER TABLE `courses`
    ADD COLUMN `avg_rating` DOUBLE DEFAULT 0.0,
    ADD COLUMN `rating_count` INT DEFAULT 0;
