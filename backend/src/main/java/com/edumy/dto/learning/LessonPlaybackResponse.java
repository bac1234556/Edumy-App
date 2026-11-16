package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Bài học kèm link video, chỉ trả cho người đã ghi danh (hoặc bài xem trước)")
public class LessonPlaybackResponse {

    private Long id;
    private Long courseId;
    private Long sectionId;
    private String title;

    @Schema(description = "Link video Cloudinary để phát", example = "https://res.cloudinary.com/demo/video/upload/dog.mp4")
    private String videoUrl;

    private Integer durationSeconds;
    private Boolean isPreview;
    private Integer orderIndex;
}
