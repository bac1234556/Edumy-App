package com.edumy.dto.admin;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminLessonDetailResponse {

    private Long id;
    private String title;
    private String videoUrl;
    private Integer durationSeconds;
    private Boolean isPreview;
    private Integer orderIndex;
}
