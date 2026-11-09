package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.instructor.CourseCreateRequest;
import com.edumy.dto.instructor.CourseResponse;
import com.edumy.dto.instructor.CourseUpdateRequest;
import com.edumy.service.InstructorCourseService;
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
@RequestMapping("/api/v1/instructor/courses")
@RequiredArgsConstructor
@Tag(name = "Instructor Courses", description = "Quản lý khóa học của giảng viên")
public class InstructorCourseController {

    private final InstructorCourseService courseService;

    private Long getCurrentInstructorId(Object principal) {
        return 1L;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách khóa học của giảng viên đang đăng nhập")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getMyCourses(@AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        return ResponseEntity.ok(ApiResponse.ok(courseService.getMyCourses(instructorId), "Lấy danh sách khóa học thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết khóa học")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseDetail(@PathVariable Long id, @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        return ResponseEntity.ok(ApiResponse.ok(courseService.getCourseById(id, instructorId), "Lấy thông tin khóa học thành công"));
    }

    @PostMapping
    @Operation(summary = "Tạo khóa học mới (trạng thái DRAFT)")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseCreateRequest request,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        CourseResponse response = courseService.createCourse(request, instructorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Tạo khóa học thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Chỉnh sửa thông tin khóa học (kiểm tra ownership)")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseUpdateRequest request,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        CourseResponse response = courseService.updateCourse(id, request, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật khóa học thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa khóa học DRAFT (kiểm tra ownership)")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        courseService.deleteCourse(id, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa khóa học thành công"));
    }

    @PostMapping("/{id}/submit-review")
    @Operation(summary = "Gửi phê duyệt khóa học (chuyển trạng thái từ DRAFT sang PENDING_REVIEW)")
    public ResponseEntity<ApiResponse<CourseResponse>> submitCourseForReview(
            @PathVariable Long id,
            @AuthenticationPrincipal Object principal) {
        Long instructorId = getCurrentInstructorId(principal);
        CourseResponse response = courseService.submitForReview(id, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Khóa học đã được gửi phê duyệt thành công"));
    }
}