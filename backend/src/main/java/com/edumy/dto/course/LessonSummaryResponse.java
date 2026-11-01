package com.edumy.dto.course;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LessonSummaryResponse {

    private Long id;
    private String title;
    private Integer durationSeconds;
    private Boolean isPreview;
    private Integer orderIndex;

    /**
     * URL video chỉ trả về khi bài học là bài xem trước (isPreview = true).
     * Khi bài học bị khóa (isPreview = false), trường này bắt buộc là null
     * để tuyệt đối không lộ link video Cloudinary ra public API.
     */
    private String videoUrl;
}
