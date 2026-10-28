package com.edumy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "questions",
    indexes = {
        @Index(name = "idx_questions_lesson_id", columnList = "lesson_id"),
        @Index(name = "idx_questions_user_id",   columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID bài học mà câu hỏi này thuộc về */
    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    /** ID học viên đặt câu hỏi */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Nội dung câu hỏi */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
