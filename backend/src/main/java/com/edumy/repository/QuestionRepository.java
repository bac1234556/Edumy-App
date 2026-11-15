package com.edumy.repository;

import com.edumy.entity.Question;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    /** Lấy danh sách câu hỏi theo bài học, sắp xếp mới nhất trước */
    Page<Question> findByLessonIdOrderByCreatedAtDesc(Long lessonId, Pageable pageable);

    /** Đếm số câu hỏi chưa được trả lời (dùng cho admin/instructor dashboard) */
    long countByLessonId(Long lessonId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select q from Question q where q.id = :id")
    Optional<Question> findLockedById(@Param("id") Long id);
}
