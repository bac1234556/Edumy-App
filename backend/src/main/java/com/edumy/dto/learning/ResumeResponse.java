package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Điểm học tiếp của khóa học: bài xem gần nhất và vị trí xem")
public class ResumeResponse {

    private Long courseId;

    @Schema(description = "Bài học xem gần nhất; chưa học bài nào thì là bài đầu tiên; null nếu khóa chưa có bài")
    private Long lessonId;

    @Schema(description = "Vị trí xem dở (giây); 0 nếu chưa học", example = "95")
    private Integer positionSec;

    @Schema(description = "Bài học này đã hoàn thành")
    private Boolean completed;

    @Schema(description = "Tiến độ cả khóa 0..100", example = "50")
    private Integer progressPercent;

    private Integer completedLessons;
    private Integer totalLessons;

    @Schema(description = "Danh sách ID bài đã hoàn thành, dùng để hiện dấu tick")
    private List<Long> completedLessonIds;
}
