package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.instructor.ReorderRequest;
import com.edumy.dto.instructor.SectionRequest;
import com.edumy.dto.instructor.SectionResponse;
import com.edumy.service.InstructorSectionService;
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
@Tag(name = "Instructor Sections", description = "Quản lý chương mục khóa học")
public class InstructorSectionController {

    private final InstructorSectionService sectionService;

    private Long getCurrentInstructorId(Object principal) {
        return 1L;
    }

    @GetMapping("/courses/{courseId}/sections")
    @Operation(summary = "Lấy danh sách section theo course")
    public ResponseEntity<ApiResponse<List<SectionResponse>>> getSections(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        return ResponseEntity.ok(ApiResponse.ok(sectionService.getSectionsByCourse(courseId, instructorId), "Thành công"));
    }

    @PostMapping("/courses/{courseId}/sections")
    @Operation(summary = "Tạo section mới trực thuộc course")
    public ResponseEntity<ApiResponse<SectionResponse>> createSection(
            @PathVariable Long courseId,
            @Valid @RequestBody SectionRequest request,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        SectionResponse response = sectionService.createSection(courseId, request, instructorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Tạo chương mới thành công"));
    }

    @PutMapping("/sections/{sectionId}")
    @Operation(summary = "Cập nhật thông tin section")
    public ResponseEntity<ApiResponse<SectionResponse>> updateSection(
            @PathVariable Long sectionId,
            @Valid @RequestBody SectionRequest request,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        SectionResponse response = sectionService.updateSection(sectionId, request, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật chương thành công"));
    }

    @DeleteMapping("/sections/{sectionId}")
    @Operation(summary = "Xóa section")
    public ResponseEntity<ApiResponse<Void>> deleteSection(
            @PathVariable Long sectionId,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        sectionService.deleteSection(sectionId, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa chương thành công"));
    }

    @PutMapping("/sections/reorder")
    @Operation(summary = "Cập nhật order_index cho danh sách section")
    public ResponseEntity<ApiResponse<Void>> reorderSections(
            @Valid @RequestBody ReorderRequest request,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        sectionService.reorderSections(request, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cập nhật thứ tự chương thành công"));
    }
}