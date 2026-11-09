package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.common.PageResponse;
import com.edumy.dto.admin.AdminCourseDetailResponse;
import com.edumy.dto.admin.AdminCourseSummaryResponse;
import com.edumy.dto.admin.RejectCourseRequest;
import com.edumy.service.AdminCourseReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/admin/courses", "/api/v1/admin/courses"})
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Course Review API", description = "Duyệt hoặc từ chối khóa học (yêu cầu quyền ADMIN)")
@CrossOrigin(origins = "*")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
public class AdminCourseReviewController {

    private final AdminCourseReviewService adminCourseReviewService;

    @GetMapping("/pending")
    @Operation(summary = "Lấy danh sách khóa học đang chờ duyệt")
    public ResponseEntity<ApiResponse<PageResponse<AdminCourseSummaryResponse>>> getPendingCourses(
            @Parameter(description = "Số thứ tự trang (0-indexed)")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Số lượng khóa học mỗi trang (tối đa 50)")
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                adminCourseReviewService.getPendingCourses(pageable),
                "Lấy danh sách khóa học chờ duyệt thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết khóa học và toàn bộ giáo trình")
    public ResponseEntity<ApiResponse<AdminCourseDetailResponse>> getCourseDetail(
            @Parameter(description = "ID khóa học", required = true) @PathVariable @Min(1) Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminCourseReviewService.getCourseDetail(id),
                "Lấy chi tiết khóa học thành công"));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Phê duyệt khóa học đang chờ duyệt")
    public ResponseEntity<ApiResponse<AdminCourseDetailResponse>> approveCourse(
            @Parameter(description = "ID khóa học", required = true) @PathVariable @Min(1) Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminCourseReviewService.approveCourse(id),
                "Phê duyệt khóa học thành công"));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Từ chối khóa học đang chờ duyệt", description = "Yêu cầu rejectionReason để gửi lại cho giảng viên.")
    public ResponseEntity<ApiResponse<AdminCourseDetailResponse>> rejectCourse(
            @Parameter(description = "ID khóa học", required = true) @PathVariable @Min(1) Long id,
            @Valid @RequestBody RejectCourseRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminCourseReviewService.rejectCourse(id, request.getRejectionReason()),
                "Từ chối khóa học thành công"));
    }
}
