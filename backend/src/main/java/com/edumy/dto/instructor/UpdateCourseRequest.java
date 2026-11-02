package com.edumy.dto.instructor;

import com.edumy.entity.CourseLevel;
import com.edumy.entity.CourseStatus;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourseRequest {

    private String title;

    private String subtitle;

    private String description;

    @DecimalMin(value = "0.0", message = "Giá khóa học phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    private String thumbnailUrl;

    private CourseLevel level;

    private Long categoryId;

    private CourseStatus status;
}
