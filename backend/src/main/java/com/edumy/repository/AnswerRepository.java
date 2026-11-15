package com.edumy.repository;

import com.edumy.entity.Answer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    /** Lấy tất cả câu trả lời của một câu hỏi, sắp xếp: accepted lên đầu, rồi mới nhất */
    List<Answer> findByQuestionIdOrderByIsAcceptedDescCreatedAtAsc(Long questionId);

    /** Kiểm tra câu hỏi đã có accepted answer chưa */
    boolean existsByQuestionIdAndIsAcceptedTrue(Long questionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Answer a where a.questionId = :questionId " +
            "order by a.isAccepted desc, a.createdAt asc")
    List<Answer> findLockedByQuestionId(@Param("questionId") Long questionId);

    @Query("select a from Answer a where a.questionId in :questionIds " +
            "order by a.questionId asc, a.isAccepted desc, a.createdAt asc")
    List<Answer> findAnswersForQuestions(@Param("questionIds") List<Long> questionIds);
}
