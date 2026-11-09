package com.edumy.dto.instructor;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseUpdateRequest {
    private String title;
    private String subtitle;
    private String description;

    @DecimalMin(value = "0.0", inclusive = true, message = "Giá phải lớn hơn hoặc bằng 0")
    @Schema(description = "Giá khóa học", example = "299000")
    private BigDecimal price;

    private String thumbnailUrl;
    private String level;
    private Long categoryId;
}