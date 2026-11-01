package com.edumy.dto.course;

import com.edumy.entity.CourseLevel;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSummaryResponse {

    private Long id;
    private String title;
    private String subtitle;
    private String thumbnailUrl;
    private BigDecimal price;
    private CourseLevel level;
    private Long instructorId;
    private String instructorName;
    private Long categoryId;
    private String categoryName;
    private Double averageRating;
    private Long totalReviews;
    private Integer totalDurationSeconds;
}
