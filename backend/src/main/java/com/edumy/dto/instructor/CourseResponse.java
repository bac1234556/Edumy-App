package com.edumy.dto.instructor;

import com.edumy.entity.CourseStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseResponse {
    private Long id;
    private String title;
    private String subtitle;
    private String description;
    private BigDecimal price;
    private String thumbnailUrl;
    private String level;
    private CourseStatus status;
    private String rejectReason;
    private Long categoryId;
    private Long instructorId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}