package com.edumy.repository;

import com.edumy.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    /** Lấy danh sách câu hỏi theo bài học, sắp xếp mới nhất trước */
    Page<Question> findByLessonIdOrderByCreatedAtDesc(Long lessonId, Pageable pageable);

    /** Đếm số câu hỏi chưa được trả lời (dùng cho admin/instructor dashboard) */
    long countByLessonId(Long lessonId);
}
