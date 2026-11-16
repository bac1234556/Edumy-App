package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.learning.ProgressResponse;
import com.edumy.dto.learning.ResumeResponse;
import com.edumy.dto.learning.SaveProgressRequest;
import com.edumy.service.LearningProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Learning Progress API", description = "Lưu vị trí xem, đánh dấu hoàn thành và học tiếp (resume)")
public class LearningProgressController {

    private final LearningProgressService learningProgressService;

    @PutMapping({"/api/learn/lessons/{lessonId}/progress", "/api/v1/learn/lessons/{lessonId}/progress"})
    @Operation(
            summary = "Lưu vị trí xem của bài học",
            description = "Nhận positionSec và completed. Xem từ 90% thời lượng thì tự đánh dấu hoàn thành " +
                          "(không cần bấm nút) và tính lại progress_percent của enrollment. " +
                          "Chưa mua khóa: 403; bài không tồn tại: 404; positionSec thiếu hoặc âm: 400."
    )
    public ResponseEntity<ApiResponse<ProgressResponse>> saveProgress(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long lessonId,
            @Valid @RequestBody SaveProgressRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(learningProgressService.saveProgress(userId, lessonId, request),
                "Lưu tiến độ thành công"));
    }

    @GetMapping({"/api/learn/courses/{courseId}/resume", "/api/v1/learn/courses/{courseId}/resume"})
    @Operation(
            summary = "Lấy điểm học tiếp của khóa học",
            description = "Trả bài học xem gần nhất và vị trí xem (giây), kèm danh sách bài đã hoàn thành. " +
                          "Chưa học bài nào thì trả bài đầu tiên ở giây 0. Chưa mua khóa: 403."
    )
    public ResponseEntity<ApiResponse<ResumeResponse>> getResume(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long courseId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(learningProgressService.getResume(userId, courseId),
                "Lấy điểm học tiếp thành công"));
    }
}
