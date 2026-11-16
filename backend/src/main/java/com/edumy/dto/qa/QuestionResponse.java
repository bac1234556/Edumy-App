package com.edumy.dto.qa;

import com.edumy.entity.Question;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@Schema(description = "Câu hỏi cùng các câu trả lời trong bài học")
public class QuestionResponse {

    private Long id;
    private Long lessonId;
    private Long authorId;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private int answerCount;
    private boolean hasAcceptedAnswer;
    private List<AnswerResponse> answers;

    public static QuestionResponse from(Question question, List<AnswerResponse> answers) {
        return QuestionResponse.builder()
                .id(question.getId())
                .lessonId(question.getLessonId())
                .authorId(question.getUserId())
                .title(question.getTitle())
                .content(question.getContent())
                .createdAt(question.getCreatedAt())
                .answerCount(answers.size())
                .hasAcceptedAnswer(answers.stream().anyMatch(AnswerResponse::getAccepted))
                .answers(answers)
                .build();
    }
}
