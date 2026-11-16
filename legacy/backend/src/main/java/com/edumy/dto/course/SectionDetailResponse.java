package com.edumy.dto.course;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionDetailResponse {
    private Long id;
    private String title;
    private Integer orderIndex;
    private List<LessonSummaryResponse> lessons;
}
