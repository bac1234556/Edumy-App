package com.edumy.dto.course;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorSummaryResponse {
    private Long id;
    private String fullName;
    private String avatarUrl;
    private String bio;
}
