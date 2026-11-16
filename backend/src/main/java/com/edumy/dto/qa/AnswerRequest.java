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
@Schema(description = "Nội dung câu trả lời")
public class AnswerRequest {

    @NotBlank(message = "Nội dung câu trả lời không được để trống")
    @Size(max = 5000, message = "Nội dung câu trả lời không được vượt quá 5000 ký tự")
    @Schema(description = "Nội dung câu trả lời", example = "Transaction giúp các thao tác được commit hoặc rollback đồng bộ.", maxLength = 5000)
    private String content;
}
