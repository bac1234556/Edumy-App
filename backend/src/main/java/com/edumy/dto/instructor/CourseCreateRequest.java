package com.edumy.dto.instructor;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseCreateRequest {
    @NotBlank(message = "Tiêu đề không được rỗng")
    @Schema(description = "Tiêu đề khóa học", example = "Khóa học Spring Boot thực chiến")
    private String title;

    private String subtitle;
    private String description;

    @NotNull(message = "Giá không được null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá phải lớn hơn hoặc bằng 0")
    @Schema(description = "Giá khóa học", example = "199000")
    private BigDecimal price;

    private String thumbnailUrl;
    private String level;
    private Long categoryId;
}