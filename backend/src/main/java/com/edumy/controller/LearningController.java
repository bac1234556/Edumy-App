package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.learning.CreateOrderRequest;
import com.edumy.dto.learning.EnrollmentResponse;
import com.edumy.dto.learning.OrderResponse;
import com.edumy.service.LearningStubService;
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
@Tag(name = "Learning API (stub)", description = "Checkout và khóa học của tôi — W7-D3 trả dữ liệu mẫu, chưa ghi DB")
public class LearningController {

    private final LearningStubService learningStubService;

    @PostMapping({"/api/orders", "/api/v1/orders"})
    @Operation(
            summary = "Tạo đơn mua khóa học (stub)",
            description = "Validate courseId/paymentMethod, lấy giá khóa học và trả đơn PENDING kèm txnRef. " +
                          "Chưa lưu DB và chưa tạo enrollment."
    )
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(learningStubService.createOrder(userId, request), "Tạo đơn hàng thành công"));
    }

    @GetMapping({"/api/me/enrollments", "/api/v1/me/enrollments"})
    @Operation(
            summary = "Danh sách khóa học đã mua kèm tiến độ (stub)",
            description = "Trả danh sách mẫu cố định cho mọi người dùng đã đăng nhập."
    )
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getMyEnrollments(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(learningStubService.getMyEnrollments(userId),
                "Lấy danh sách khóa học của tôi thành công"));
    }
}
