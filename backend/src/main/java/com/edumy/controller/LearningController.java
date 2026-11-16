package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.learning.CreateOrderRequest;
import com.edumy.dto.learning.EnrollmentResponse;
import com.edumy.dto.learning.OrderResponse;
import com.edumy.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
            summary = "Checkout khóa học (mock hoặc VNPay sandbox)",
            description = "payment.provider=mock: tạo Order PENDING, giả lập thanh toán thành công (PAID) rồi tạo Enrollment. " +
                          "payment.provider=vnpay: tạo Order PENDING và trả paymentUrl đã ký HMAC-SHA512; " +
                          "Enrollment chỉ được tạo khi VNPay xác nhận thành công. " +
                          "Khóa 0đ: tạo Enrollment trực tiếp (status FREE). " +
                          "404 nếu khóa không tồn tại/chưa xuất bản, 409 nếu đã sở hữu khóa học."
    )
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateOrderRequest request,
            HttpServletRequest httpRequest
    ) {
        OrderResponse order = enrollmentService.checkout(userId, request, clientIp(httpRequest));
        String message = "PENDING".equals(order.getStatus()) ? "Tạo đơn hàng thành công, chuyển sang trang thanh toán"
                : "Thanh toán thành công";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(order, message));
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
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
