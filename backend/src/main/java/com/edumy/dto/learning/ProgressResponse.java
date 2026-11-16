package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Tiến độ bài học vừa lưu và tiến độ tổng của khóa học")
public class ProgressResponse {

    private Long lessonId;
    private Long courseId;
    private Integer positionSec;

    @Schema(description = "Bài học đã hoàn thành (tự động khi xem ≥ 90% hoặc client gửi completed = true)")
    private Boolean completed;

    @Schema(description = "Tiến độ cả khóa 0..100", example = "50")
    private Integer progressPercent;

    private Integer completedLessons;
    private Integer totalLessons;

    @Schema(description = "true khi đã hoàn thành 100% khóa học")
    private Boolean courseCompleted;
}
