package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.common.PageResponse;
import com.edumy.dto.course.CourseDetailResponse;
import com.edumy.dto.course.CourseSummaryResponse;
import com.edumy.service.CoursePublicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/courses", "/api/courses"})
@RequiredArgsConstructor
@Tag(name = "Course Public API", description = "Các endpoint công khai khám phá khóa học (không yêu cầu đăng nhập)")
@CrossOrigin(origins = "*")
public class CoursePublicController {

    private final CoursePublicService coursePublicService;

    @GetMapping
    @Operation(
            summary = "Lấy danh sách khóa học công khai",
            description = "Chỉ trả về các khóa học có trạng thái PUBLISHED, hỗ trợ phân trang và lọc theo danh mục."
    )
    public ResponseEntity<ApiResponse<PageResponse<CourseSummaryResponse>>> getPublishedCourses(
            @Parameter(description = "ID của danh mục cần lọc (tùy chọn)")
            @RequestParam(required = false) Long categoryId,

            @Parameter(description = "Số thứ tự trang (0-indexed, mặc định 0)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Số lượng khóa học trên mỗi trang (mặc định 10)")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Sắp xếp theo trường, ví dụ: 'createdAt,desc' hoặc 'price,asc'")
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        PageResponse<CourseSummaryResponse> response = coursePublicService.getPublishedCourses(categoryId, pageable);

        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy danh sách khóa học thành công"));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Xem chi tiết khóa học và giáo trình",
            description = "Trả về thông tin chi tiết khóa học, giảng viên và khung giáo trình (sections -> lessons). " +
                          "BẢO MẬT: Chỉ bài học preview mới có videoUrl, các bài bị khóa luôn trả videoUrl = null."
    )
    public ResponseEntity<ApiResponse<CourseDetailResponse>> getCourseDetail(
            @Parameter(description = "ID của khóa học", required = true)
            @PathVariable Long id
    ) {
        CourseDetailResponse response = coursePublicService.getCourseDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy chi tiết khóa học thành công"));
    }
}
