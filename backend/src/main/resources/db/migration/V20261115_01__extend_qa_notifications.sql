ALTER TABLE questions
    ADD COLUMN title VARCHAR(255) NULL AFTER user_id;

UPDATE questions
SET title = LEFT(content, 255)
WHERE title IS NULL;

ALTER TABLE questions
    ADD CONSTRAINT fk_questions_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id),
    ADD CONSTRAINT fk_questions_user FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE answers
    ADD CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_answers_user FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE notifications
    ADD COLUMN reference_id BIGINT NULL AFTER body;
