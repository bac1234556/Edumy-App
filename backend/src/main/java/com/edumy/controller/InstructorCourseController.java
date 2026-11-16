package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.instructor.CloudinarySignatureResponse;
import com.edumy.dto.instructor.CreateCourseRequest;
import com.edumy.dto.instructor.InstructorCourseResponse;
import com.edumy.dto.instructor.UpdateCourseRequest;
import com.edumy.exception.UnauthorizedException;
import com.edumy.service.InstructorCourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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
    @Operation(summary = "Cập nhật khóa học (chỉ chủ sở hữu)",
            description = "Cho sửa khóa học ở mọi trạng thái, kể cả PUBLISHED và REJECTED. "
                    + "Trường status không được nhận từ client nên sửa khóa không làm đổi trạng thái.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật khóa học thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không phải chủ sở hữu khóa học",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy khóa học hoặc danh mục",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
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
    @Operation(summary = "Xóa khóa học (chỉ chủ sở hữu)",
            description = "Không cho xóa khóa học đã có học viên đăng ký (trả 409 kèm thông báo).")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Xóa khóa học thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không phải chủ sở hữu khóa học",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy khóa học",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Khóa học đã có học viên đăng ký nên không thể xóa",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        instructorCourseService.deleteCourse(id, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa khóa học thành công"));
    }

    @PostMapping({"/api/instructor/courses/{id}/submit-review", "/api/v1/instructor/courses/{id}/submit-review"})
    @Operation(summary = "Gửi phê duyệt khóa học (DRAFT hoặc REJECTED sang PENDING)",
            description = "Khóa học bị từ chối (REJECTED) sau khi sửa có thể gửi duyệt lại; lý do từ chối cũ được xóa.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Gửi phê duyệt thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Trạng thái không hợp lệ hoặc thiếu chương/bài học có video",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không phải chủ sở hữu khóa học",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy khóa học",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<InstructorCourseResponse>> submitCourseForReview(
            @PathVariable Long id,
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        InstructorCourseResponse response = instructorCourseService.submitForReview(id, instructorId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Khóa học đã được gửi phê duyệt thành công"));
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
