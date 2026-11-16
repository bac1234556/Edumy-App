package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.review.CourseReviewListResponse;
import com.edumy.dto.review.ReviewItemResponse;
import com.edumy.dto.review.ReviewRequest;
import com.edumy.exception.UnauthorizedException;
import com.edumy.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Course Reviews", description = "Đánh giá và nhận xét khóa học")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping({"/api/courses/{id}/reviews", "/api/v1/courses/{id}/reviews"})
    @Operation(summary = "Lấy danh sách đánh giá của khóa học kèm phân bố số sao")
    public ResponseEntity<ApiResponse<CourseReviewListResponse>> getCourseReviews(
            @PathVariable Long id,
            @AuthenticationPrincipal Long currentUserId,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        CourseReviewListResponse response = reviewService.getCourseReviews(id, currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy danh sách đánh giá thành công"));
    }

    @PostMapping({"/api/courses/{id}/reviews", "/api/v1/courses/{id}/reviews"})
    @Operation(summary = "Gửi đánh giá khóa học (chỉ học viên đã mua khóa)")
    public ResponseEntity<ApiResponse<ReviewItemResponse>> createReview(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReviewRequest request
    ) {
        ensureAuthenticated(userId);
        ReviewItemResponse response = reviewService.createReview(id, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Đánh giá khóa học thành công"));
    }

    @PutMapping({"/api/courses/{id}/reviews", "/api/v1/courses/{id}/reviews"})
    @Operation(summary = "Chỉnh sửa đánh giá của chính mình")
    public ResponseEntity<ApiResponse<ReviewItemResponse>> updateReview(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ReviewRequest request
    ) {
        ensureAuthenticated(userId);
        ReviewItemResponse response = reviewService.updateReview(id, userId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật đánh giá thành công"));
    }

    @DeleteMapping({"/api/courses/{id}/reviews", "/api/v1/courses/{id}/reviews"})
    @Operation(summary = "Xóa đánh giá của chính mình")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId
    ) {
        ensureAuthenticated(userId);
        reviewService.deleteReview(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa đánh giá thành công"));
    }

    private void ensureAuthenticated(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
    }
}
