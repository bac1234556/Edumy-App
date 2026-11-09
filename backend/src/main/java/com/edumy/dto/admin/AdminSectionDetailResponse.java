package com.edumy.dto.admin;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminSectionDetailResponse {

    private Long id;
    private String title;
    private Integer orderIndex;
    private List<AdminLessonDetailResponse> lessons;
}
