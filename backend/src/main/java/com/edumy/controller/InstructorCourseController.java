package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.instructor.CloudinarySignatureResponse;
import com.edumy.dto.instructor.CreateCourseRequest;
import com.edumy.dto.instructor.InstructorCourseResponse;
import com.edumy.dto.instructor.UpdateCourseRequest;
import com.edumy.exception.UnauthorizedException;
import com.edumy.service.InstructorCourseService;
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
@Tag(name = "Instructor Course API", description = "Quản lý khóa học dành cho giảng viên")
public class InstructorCourseController {

    private final InstructorCourseService instructorCourseService;

    @GetMapping({"/api/instructor/courses", "/api/v1/instructor/courses"})
    @Operation(summary = "Lấy danh sách khóa học của giảng viên hiện tại")
    public ResponseEntity<ApiResponse<List<InstructorCourseResponse>>> getMyCourses(
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        List<InstructorCourseResponse> courses = instructorCourseService.getCoursesByInstructor(instructorId);
        return ResponseEntity.ok(ApiResponse.ok(courses, "Lấy danh sách khóa học thành công"));
    }

    @GetMapping({"/api/instructor/courses/{id}", "/api/v1/instructor/courses/{id}"})
    @Operation(summary = "Lấy chi tiết khóa học của giảng viên")
    public ResponseEntity<ApiResponse<InstructorCourseResponse>> getCourseDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        InstructorCourseResponse course = instructorCourseService.getCourseDetail(id, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(course, "Lấy chi tiết khóa học thành công"));
    }

    @PostMapping({"/api/instructor/courses", "/api/v1/instructor/courses"})
    @Operation(summary = "Tạo khóa học mới (trạng thái DRAFT)")
    public ResponseEntity<ApiResponse<InstructorCourseResponse>> createCourse(
            @AuthenticationPrincipal Long instructorId,
            @Valid @RequestBody CreateCourseRequest request
    ) {
        ensureAuthenticated(instructorId);
        InstructorCourseResponse created = instructorCourseService.createCourse(instructorId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(created, "Tạo khóa học thành công"));
    }

    @PutMapping({"/api/instructor/courses/{id}", "/api/v1/instructor/courses/{id}"})
    @Operation(summary = "Cập nhật khóa học (chỉ chủ sở hữu)")
    public ResponseEntity<ApiResponse<InstructorCourseResponse>> updateCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal Long instructorId,
            @Valid @RequestBody UpdateCourseRequest request
    ) {
        ensureAuthenticated(instructorId);
        InstructorCourseResponse updated = instructorCourseService.updateCourse(id, instructorId, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Cập nhật khóa học thành công"));
    }

    @DeleteMapping({"/api/instructor/courses/{id}", "/api/v1/instructor/courses/{id}"})
    @Operation(summary = "Xóa khóa học (chỉ chủ sở hữu)")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        instructorCourseService.deleteCourse(id, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa khóa học thành công"));
    }

    @PostMapping({"/api/instructor/media/signature", "/api/v1/instructor/media/signature"})
    @Operation(summary = "Lấy chữ ký bảo mật tải video/ảnh trực tiếp lên Cloudinary")
    public ResponseEntity<ApiResponse<CloudinarySignatureResponse>> getCloudinarySignature(
            @AuthenticationPrincipal Long instructorId,
            @RequestParam(required = false, defaultValue = "edumy/courses") String folder
    ) {
        ensureAuthenticated(instructorId);
        CloudinarySignatureResponse sig = instructorCourseService.getUploadSignature(instructorId, folder);
        return ResponseEntity.ok(ApiResponse.ok(sig, "Sinh chữ ký upload thành công"));
    }

    private void ensureAuthenticated(Long instructorId) {
        if (instructorId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập với quyền giảng viên");
        }
    }
}
