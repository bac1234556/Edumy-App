package com.edumy.dto.instructor;

import com.edumy.entity.LessonType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonRequest {
    @NotBlank(message = "Tiêu đề bài học không được rỗng")
    @Schema(description = "Tiêu đề bài học", example = "Bài 1: Cài đặt JDK")
    private String title;

    @NotNull(message = "Loại bài học không được rỗng")
    @Schema(description = "Loại bài học (VIDEO / TEXT)", example = "VIDEO")
    private LessonType type;

    private String videoUrl;
    private String publicId;
    private Integer durationSec;
    private Boolean isPreview;
}