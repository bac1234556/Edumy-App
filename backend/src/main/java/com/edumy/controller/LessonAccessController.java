package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.learning.LessonPlaybackResponse;
import com.edumy.service.LessonAccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Learning Player API", description = "Lấy bài học để phát video, có kiểm tra quyền ghi danh")
public class LessonAccessController {

    private final LessonAccessService lessonAccessService;

    @GetMapping({"/api/v1/learning/courses/{courseId}/lessons/{lessonId}",
            "/api/learning/courses/{courseId}/lessons/{lessonId}"})
    @Operation(
            summary = "Lấy bài học để phát video",
            description = "Trả videoUrl khi người dùng đã ghi danh khóa học hoặc bài là bài xem trước. " +
                          "Chưa mua khóa: 403. Khóa/bài không tồn tại hoặc bài không thuộc khóa: 404."
    )
    public ResponseEntity<ApiResponse<LessonPlaybackResponse>> getLesson(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long courseId,
            @PathVariable Long lessonId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(lessonAccessService.getLesson(userId, courseId, lessonId),
                "Lấy bài học thành công"));
    }
}
