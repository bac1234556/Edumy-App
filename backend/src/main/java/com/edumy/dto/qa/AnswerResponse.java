package com.edumy.dto.qa;

import com.edumy.entity.Answer;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@Schema(description = "Câu trả lời; không bao gồm dữ liệu nhạy cảm của tác giả")
public class AnswerResponse {

    private Long id;
    private Long questionId;
    private Long authorId;
    private String content;
    private Boolean accepted;
    private LocalDateTime createdAt;

    public static AnswerResponse from(Answer answer) {
        return AnswerResponse.builder()
                .id(answer.getId())
                .questionId(answer.getQuestionId())
                .authorId(answer.getUserId())
                .content(answer.getContent())
                .accepted(Boolean.TRUE.equals(answer.getIsAccepted()))
                .createdAt(answer.getCreatedAt())
                .build();
    }
}
