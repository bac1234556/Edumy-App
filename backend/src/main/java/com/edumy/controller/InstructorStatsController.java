package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.common.PageResponse;
import com.edumy.dto.instructor.InstructorStatsResponse;
import com.edumy.dto.instructor.InstructorStudentResponse;
import com.edumy.exception.UnauthorizedException;
import com.edumy.service.InstructorStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/instructor")
@RequiredArgsConstructor
@Validated
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Instructor Statistics API", description = "Thống kê và danh sách học viên dành cho giảng viên")
public class InstructorStatsController {

    private final InstructorStatsService instructorStatsService;

    @GetMapping("/stats")
    @Operation(summary = "Thống kê tổng quan của giảng viên")
    public ResponseEntity<ApiResponse<InstructorStatsResponse>> getInstructorStats(
            @AuthenticationPrincipal Long instructorId
    ) {
        ensureAuthenticated(instructorId);
        InstructorStatsResponse stats = instructorStatsService.getInstructorStats(instructorId);
        return ResponseEntity.ok(ApiResponse.ok(stats, "Lấy thống kê giảng viên thành công"));
    }

    @GetMapping("/courses/{id}/students")
    @Operation(summary = "Danh sách học viên của khóa học, có phân trang và tiến độ học tập")
    public ResponseEntity<ApiResponse<PageResponse<InstructorStudentResponse>>> getCourseStudents(
            @PathVariable("id") @Positive Long id,
            @AuthenticationPrincipal Long instructorId,
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        ensureAuthenticated(instructorId);
        Page<InstructorStudentResponse> students = instructorStatsService.getCourseStudents(
                id,
                instructorId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return ResponseEntity.ok(ApiResponse.ok(
                PageResponse.from(students),
                "Lấy danh sách học viên thành công"
        ));
    }

    private void ensureAuthenticated(Long instructorId) {
        if (instructorId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập với quyền giảng viên");
        }
    }
}
