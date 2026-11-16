package com.edumy.dto.course;

import com.edumy.entity.Category;
import com.edumy.entity.CourseLevel;
import com.edumy.entity.CourseStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseDetailResponse {

    private Long id;
    private String title;
    private String subtitle;
    private String description;
    private String thumbnailUrl;
    private BigDecimal price;
    private CourseLevel level;
    private CourseStatus status;
    private Integer totalDurationSeconds;

    private InstructorSummaryResponse instructor;
    private Category category;
    private List<SectionDetailResponse> curriculum;

    private Double averageRating;
    private Long totalReviews;
    private LocalDateTime createdAt;
}
