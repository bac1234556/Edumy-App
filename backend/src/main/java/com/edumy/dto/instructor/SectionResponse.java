package com.edumy.dto.instructor;

import com.edumy.entity.Section;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionResponse {
    private Long id;
    private Long courseId;
    private String title;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SectionResponse fromEntity(Section section) {
        return SectionResponse.builder()
                .id(section.getId())
                .courseId(section.getCourseId())
                .title(section.getTitle())
                .orderIndex(section.getOrderIndex())
                .createdAt(section.getCreatedAt())
                .updatedAt(section.getUpdatedAt())
                .build();
    }
}
