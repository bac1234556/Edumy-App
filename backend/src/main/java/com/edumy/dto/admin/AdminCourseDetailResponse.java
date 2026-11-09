package com.edumy.dto.admin;

import com.edumy.dto.course.InstructorSummaryResponse;
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
public class AdminCourseDetailResponse {

    private Long id;
    private String title;
    private String subtitle;
    private String description;
    private String thumbnailUrl;
    private BigDecimal price;
    private CourseLevel level;
    private CourseStatus status;
    private String rejectionReason;
    private Integer totalDurationSeconds;
    private InstructorSummaryResponse instructor;
    private Category category;
    private List<AdminSectionDetailResponse> curriculum;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
