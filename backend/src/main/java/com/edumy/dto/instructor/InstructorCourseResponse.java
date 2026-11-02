package com.edumy.dto.instructor;

import com.edumy.entity.Course;
import com.edumy.entity.CourseLevel;
import com.edumy.entity.CourseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorCourseResponse {

    private Long id;
    private Long instructorId;
    private Long categoryId;
    private String title;
    private String subtitle;
    private String description;
    private String thumbnailUrl;
    private BigDecimal price;
    private CourseLevel level;
    private CourseStatus status;
    private String rejectionReason;
    private Integer totalDurationSeconds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static InstructorCourseResponse fromEntity(Course course) {
        return InstructorCourseResponse.builder()
                .id(course.getId())
                .instructorId(course.getInstructorId())
                .categoryId(course.getCategoryId())
                .title(course.getTitle())
                .subtitle(course.getSubtitle())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .price(course.getPrice())
                .level(course.getLevel())
                .status(course.getStatus())
                .rejectionReason(course.getRejectionReason())
                .totalDurationSeconds(course.getTotalDurationSeconds())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}
