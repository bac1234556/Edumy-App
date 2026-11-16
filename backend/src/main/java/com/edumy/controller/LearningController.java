package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.learning.CreateOrderRequest;
import com.edumy.dto.learning.EnrollmentResponse;
import com.edumy.dto.learning.OrderResponse;
import com.edumy.service.EnrollmentService;
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
@Tag(name = "Learning API", description = "Mock checkout và danh sách khóa học đã ghi danh")
public class LearningController {

    private final EnrollmentService enrollmentService;

    @PostMapping({"/api/v1/orders/checkout", "/api/orders/checkout"})
    @Operation(
            summary = "Mock checkout khóa học",
            description = "Khóa có phí: tạo Order PENDING, giả lập thanh toán thành công (PAID) rồi tạo Enrollment. " +
                          "Khóa 0đ: tạo Enrollment trực tiếp (status FREE). " +
                          "404 nếu khóa không tồn tại/chưa xuất bản, 409 nếu đã sở hữu khóa học."
    )
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(enrollmentService.checkout(userId, request), "Thanh toán thành công"));
    }

    @GetMapping({"/api/v1/learning/my-courses", "/api/learning/my-courses",
            "/api/v1/me/enrollments", "/api/me/enrollments"})
    @Operation(
            summary = "Danh sách khóa học đã ghi danh của tôi",
            description = "Trả các khóa đã mua/ghi danh của người dùng hiện tại, mới nhất trước, kèm tiến độ."
    )
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getMyCourses(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(enrollmentService.getMyCourses(userId),
                "Lấy danh sách khóa học của tôi thành công"));
    }
}
