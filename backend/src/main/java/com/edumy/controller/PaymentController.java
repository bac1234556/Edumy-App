package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.config.PaymentProperties;
import com.edumy.dto.learning.OrderResponse;
import com.edumy.service.PaymentService;
import com.edumy.service.PaymentService.Outcome;
import com.edumy.service.PaymentService.VnpayResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/** W10-D1 (Issue #95): cổng thanh toán VNPay sandbox. */
@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Payment API", description = "VNPay sandbox: Return URL, IPN và trạng thái đơn hàng")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentProperties paymentProperties;

    @GetMapping({"/api/v1/payments/provider", "/api/payments/provider"})
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cổng thanh toán đang bật", description = "mock hoặc vnpay (cờ cấu hình payment.provider).")
    public ResponseEntity<ApiResponse<Map<String, String>>> provider() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("provider", paymentProperties.providerName()),
                "Lấy cổng thanh toán thành công"));
    }

    @GetMapping({"/api/v1/orders/{txnRef}", "/api/orders/{txnRef}"})
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Trạng thái đơn hàng của tôi",
            description = "App gọi sau khi quay về từ trang thanh toán. Chỉ chủ đơn xem được (người khác 404).")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @AuthenticationPrincipal Long userId,
            @PathVariable String txnRef
    ) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getOrder(userId, txnRef), "Lấy đơn hàng thành công"));
    }

    @GetMapping({"/api/v1/payments/vnpay/return", "/api/payments/vnpay/return"})
    @Operation(
            summary = "VNPay Return URL (công khai)",
            description = "Trình duyệt được VNPay chuyển về đây. Xác minh checksum, cập nhật đơn (PAID/FAILED, tạo Enrollment) " +
                          "rồi chuyển hướng 302 về app (deep link) kèm status và txnRef. " +
                          "Sai checksum: không đổi gì, trả về app với status=INVALID."
    )
    public ResponseEntity<Void> vnpayReturn(
            HttpServletRequest request,
            @Parameter(description = "Deep link quay về app do app gửi lúc checkout") @RequestParam(value = "app", required = false) String app
    ) {
        VnpayResult result = paymentService.confirmVnpay(flatten(request));
        String status = switch (result.outcome()) {
            case OK, ALREADY_CONFIRMED -> result.order().getStatus().name();
            default -> "INVALID";
        };
        String txnRef = result.order() != null ? result.order().getTxnRef() : request.getParameter("vnp_TxnRef");
        String target = paymentProperties.isAllowedRedirect(app) ? app : paymentProperties.getAppRedirect();
        String location = target + (target.contains("?") ? "&" : "?") + "status=" + status
                + (txnRef != null ? "&txnRef=" + URLEncoder.encode(txnRef, StandardCharsets.UTF_8) : "");
        return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, location).build();
    }

    @GetMapping({"/api/v1/payments/vnpay/ipn", "/api/payments/vnpay/ipn"})
    @Operation(
            summary = "VNPay IPN (công khai)",
            description = "VNPay gọi server-to-server. Trả JSON theo đặc tả VNPay: RspCode 00 thành công, 01 không thấy đơn, " +
                          "02 đã xác nhận, 04 sai số tiền, 97 sai checksum, 99 lỗi khác."
    )
    public Map<String, String> vnpayIpn(HttpServletRequest request) {
        try {
            VnpayResult result = paymentService.confirmVnpay(flatten(request));
            return switch (result.outcome()) {
                case OK -> reply("00", "Confirm Success");
                case ALREADY_CONFIRMED -> reply("02", "Order already confirmed");
                case ORDER_NOT_FOUND -> reply("01", "Order not found");
                case INVALID_AMOUNT -> reply("04", "Invalid amount");
                case INVALID_SIGNATURE -> reply("97", "Invalid signature");
            };
        } catch (RuntimeException e) {
            log.error("VNPay IPN lỗi: ", e);
            return reply("99", "Unknown error");
        }
    }

    private static Map<String, String> reply(String code, String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("RspCode", code);
        body.put("Message", message);
        return body;
    }

    private static Map<String, String> flatten(HttpServletRequest request) {
        Map<String, String> params = new LinkedHashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values.length > 0) {
                params.put(key, values[0]);
            }
        });
        return params;
    }
}
