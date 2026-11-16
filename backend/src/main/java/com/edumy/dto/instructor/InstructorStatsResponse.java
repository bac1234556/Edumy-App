package com.edumy.dto.instructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorStatsResponse {

    private long totalCourses;
    private long totalStudents;
    private BigDecimal totalRevenue;
    private double averageRating;
}
