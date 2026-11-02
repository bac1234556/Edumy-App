package com.edumy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "answers",
    indexes = {
        @Index(name = "idx_answers_question_id", columnList = "question_id"),
        @Index(name = "idx_answers_user_id",     columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID câu hỏi mà câu trả lời này thuộc về */
    @Column(name = "question_id", nullable = false)
    private Long questionId;

    /** ID người dùng trả lời (học viên hoặc giảng viên) */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Nội dung câu trả lời */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Giảng viên đánh dấu câu trả lời này là chính xác / hữu ích.
     * Mỗi câu hỏi chỉ nên có tối đa 1 câu trả lời được accepted.
     */
    @Column(name = "is_accepted", nullable = false)
    @Builder.Default
    private Boolean isAccepted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
