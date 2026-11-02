package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin đơn hàng vừa tạo")
public class OrderResponse {

    @Schema(description = "Mã tham chiếu thanh toán", example = "EDU20261102153000123456")
    private String txnRef;
    private Long courseId;
    private String courseTitle;
    private BigDecimal amount;

    @Schema(allowableValues = {"PENDING", "PAID", "FAILED"})
    private String status;

    @Schema(allowableValues = {"MOCK", "VNPAY"})
    private String paymentMethod;

    private LocalDateTime createdAt;
}
