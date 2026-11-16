package com.edumy.dto.instructor;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionRequest {
    @NotBlank(message = "Tiêu đề chương không được để trống")
    @Schema(description = "Tiêu đề chương mục", example = "Chương 1: Giới thiệu")
    private String title;
}
