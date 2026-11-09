package com.edumy.dto.admin;

import com.edumy.entity.CourseLevel;
import com.edumy.entity.CourseStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCourseSummaryResponse {

    private Long id;
    private String title;
    private String subtitle;
    private String thumbnailUrl;
    private BigDecimal price;
    private CourseLevel level;
    private CourseStatus status;
    private Integer totalDurationSeconds;
    private Long instructorId;
    private String instructorName;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
}
