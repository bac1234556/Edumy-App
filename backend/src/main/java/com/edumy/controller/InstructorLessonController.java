package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.instructor.LessonRequest;
import com.edumy.dto.instructor.LessonResponse;
import com.edumy.dto.instructor.ReorderRequest;
import com.edumy.exception.UnauthorizedException;
import com.edumy.service.InstructorLessonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Instructor Lessons", description = "Quản lý bài học trực thuộc chương dành cho giảng viên")
public class InstructorLessonController {

    private final InstructorLessonService lessonService;

    @GetMapping({"/api/instructor/sections/{sectionId}/lessons", "/api/v1/instructor/sections/{sectionId}/lessons"})
    @Operation(summary = "Lấy danh sách bài học theo section")
    public ResponseEntity<ApiResponse<List<LessonResponse>>> getLessons(
            @PathVariable Long sectionId,
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getLessonsBySection(sectionId, instructorId), "Thành công"));
    }

    @PostMapping({"/api/instructor/sections/{sectionId}/lessons", "/api/v1/instructor/sections/{sectionId}/lessons"})
    @Operation(summary = "Tạo bài học mới trong section")
    public ResponseEntity<ApiResponse<LessonResponse>> createLesson(
            @PathVariable Long sectionId,
            @Valid @RequestBody LessonRequest request,
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        LessonResponse response = lessonService.createLesson(sectionId, request, instructorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Tạo bài học thành công"));
    }

    @PutMapping({"/api/instructor/lessons/{lessonId}", "/api/v1/instructor/lessons/{lessonId}"})
    @Operation(summary = "Cập nhật nội dung bài học")
    public ResponseEntity<ApiResponse<LessonResponse>> updateLesson(
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonRequest request,
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        LessonResponse response = lessonService.updateLesson(lessonId, request, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật bài học thành công"));
    }

    @DeleteMapping({"/api/instructor/lessons/{lessonId}", "/api/v1/instructor/lessons/{lessonId}"})
    @Operation(summary = "Xóa bài học")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        lessonService.deleteLesson(lessonId, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa bài học thành công"));
    }

    @PutMapping({"/api/instructor/lessons/reorder", "/api/v1/instructor/lessons/reorder"})
    @Operation(summary = "Cập nhật order_index cho danh sách lesson")
    public ResponseEntity<ApiResponse<Void>> reorderLessons(
            @Valid @RequestBody ReorderRequest request,
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        lessonService.reorderLessons(request, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cập nhật thứ tự bài học thành công"));
    }

    private void ensureAuthenticated(Long instructorId) {
        if (instructorId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập với quyền giảng viên");
        }
    }
}
