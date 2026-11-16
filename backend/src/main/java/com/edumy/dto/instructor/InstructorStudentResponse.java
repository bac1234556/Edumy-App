package com.edumy.dto.instructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorStudentResponse {

    private Long enrollmentId;
    private Long userId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private int progressPercent;
    private LocalDateTime enrolledAt;
}
