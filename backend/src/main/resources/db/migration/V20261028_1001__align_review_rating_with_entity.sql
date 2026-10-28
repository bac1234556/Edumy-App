-- Review.rating is Integer; Hibernate validation requires INT rather than TINYINT.
-- Widening preserves existing values and the original CHECK (rating BETWEEN 1 AND 5).
ALTER TABLE reviews MODIFY COLUMN rating INT NOT NULL;
