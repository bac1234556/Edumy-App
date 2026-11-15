package com.edumy.dto.qa;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Nội dung câu hỏi trong bài học")
public class QuestionRequest {

    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    @Schema(description = "Tiêu đề tùy chọn; mặc định lấy từ dòng đầu tiên của nội dung", example = "Làm rõ phần này")
    private String title;

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Size(max = 5000, message = "Nội dung câu hỏi không được vượt quá 5000 ký tự")
    @Schema(description = "Nội dung câu hỏi", example = "Tại sao cần dùng transaction ở bước này?", maxLength = 5000)
    private String content;
}
