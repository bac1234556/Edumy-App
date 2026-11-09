package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.instructor.LessonRequest;
import com.edumy.dto.instructor.LessonResponse;
import com.edumy.dto.instructor.ReorderRequest;
import com.edumy.service.InstructorLessonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/instructor")
@RequiredArgsConstructor
@Tag(name = "Instructor Lessons", description = "Quản lý bài học trực thuộc chương")
public class InstructorLessonController {

    private final InstructorLessonService lessonService;

    private Long getCurrentInstructorId(Object principal) {
        return 1L;
    }

    @GetMapping("/sections/{sectionId}/lessons")
    @Operation(summary = "Lấy danh sách bài học theo section")
    public ResponseEntity<ApiResponse<List<LessonResponse>>> getLessons(
            @PathVariable Long sectionId,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getLessonsBySection(sectionId, instructorId), "Thành công"));
    }

    @PostMapping("/sections/{sectionId}/lessons")
    @Operation(summary = "Tạo bài học mới trong section")
    public ResponseEntity<ApiResponse<LessonResponse>> createLesson(
            @PathVariable Long sectionId,
            @Valid @RequestBody LessonRequest request,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        LessonResponse response = lessonService.createLesson(sectionId, request, instructorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Tạo bài học thành công"));
    }

    @PutMapping("/lessons/{lessonId}")
    @Operation(summary = "Cập nhật nội dung bài học")
    public ResponseEntity<ApiResponse<LessonResponse>> updateLesson(
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonRequest request,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        LessonResponse response = lessonService.updateLesson(lessonId, request, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật bài học thành công"));
    }

    @DeleteMapping("/lessons/{lessonId}")
    @Operation(summary = "Xóa bài học")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        lessonService.deleteLesson(lessonId, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa bài học thành công"));
    }

    @PutMapping("/lessons/reorder")
    @Operation(summary = "Cập nhật order_index cho danh sách lesson")
    public ResponseEntity<ApiResponse<Void>> reorderLessons(
            @Valid @RequestBody ReorderRequest request,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        lessonService.reorderLessons(request, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cập nhật thứ tự bài học thành công"));
    }
}