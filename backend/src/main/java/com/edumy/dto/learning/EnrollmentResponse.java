package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Khóa học đã ghi danh kèm tiến độ")
public class EnrollmentResponse {

    private Long id;
    private Long courseId;
    private String courseTitle;
    private String thumbnailUrl;
    private String instructorName;

    @Schema(description = "Tiến độ 0..100", example = "33")
    private Integer progressPercent;

    private Integer completedLessons;
    private Integer totalLessons;
    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;
}
