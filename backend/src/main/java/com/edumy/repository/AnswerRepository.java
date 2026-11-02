package com.edumy.repository;

import com.edumy.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    /** Lấy tất cả câu trả lời của một câu hỏi, sắp xếp: accepted lên đầu, rồi mới nhất */
    List<Answer> findByQuestionIdOrderByIsAcceptedDescCreatedAtAsc(Long questionId);

    /** Kiểm tra câu hỏi đã có accepted answer chưa */
    boolean existsByQuestionIdAndIsAcceptedTrue(Long questionId);
}
