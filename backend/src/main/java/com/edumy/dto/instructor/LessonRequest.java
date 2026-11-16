package com.edumy.dto.instructor;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
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

    @Schema(description = "URL video bài học")
    private String videoUrl;

    @Schema(description = "Cloudinary public ID")
    private String publicId;

    @Schema(description = "Thời lượng video tính bằng giây", example = "300")
    private Integer durationSec;

    @Schema(description = "Cho phép xem trước miễn phí hay không", example = "false")
    private Boolean isPreview;
}
