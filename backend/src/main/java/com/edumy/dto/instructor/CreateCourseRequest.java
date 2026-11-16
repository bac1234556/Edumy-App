package com.edumy.dto.instructor;

import com.edumy.entity.CourseLevel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String subtitle;

    private String description;

    @NotNull(message = "Giá khóa học không được để trống")
    @DecimalMin(value = "0.0", message = "Giá khóa học phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    private String thumbnailUrl;

    @Builder.Default
    private CourseLevel level = CourseLevel.ALL_LEVELS;

    @NotNull(message = "ID danh mục không được để trống")
    private Long categoryId;
}
