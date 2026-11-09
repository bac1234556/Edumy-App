package com.edumy.dto.instructor;

import com.edumy.entity.LessonType;
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
    private LessonType type;
    private String videoUrl;
    private String publicId;
    private Integer durationSec;
    private Boolean isPreview;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}