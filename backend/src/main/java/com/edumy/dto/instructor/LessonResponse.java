package com.edumy.dto.instructor;

import com.edumy.entity.Lesson;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResponse {
    private Long id;
    private Long sectionId;
    private String title;
    private String videoUrl;
    private String publicId;
    private Integer durationSec;
    private Boolean isPreview;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static LessonResponse fromEntity(Lesson lesson) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .sectionId(lesson.getSectionId())
                .title(lesson.getTitle())
                .videoUrl(lesson.getVideoUrl())
                .publicId(lesson.getVideoPublicId())
                .durationSec(lesson.getDurationSeconds())
                .isPreview(lesson.getIsPreview())
                .orderIndex(lesson.getOrderIndex())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }
}
