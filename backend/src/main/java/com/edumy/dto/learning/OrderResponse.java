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
@Schema(description = "Kết quả checkout: đơn hàng (nếu có phí) và bản ghi ghi danh")
public class OrderResponse {

    @Schema(description = "ID đơn hàng (null với khóa miễn phí)")
    private Long orderId;

    @Schema(description = "Mã tham chiếu thanh toán (null với khóa miễn phí)", example = "EDU20261109153000123456")
    private String txnRef;

    private Long courseId;
    private String courseTitle;
    private BigDecimal amount;

    @Schema(description = "Trạng thái đơn; FREE khi khóa 0đ được ghi danh trực tiếp", allowableValues = {"PAID", "FREE"})
    private String status;

    @Schema(allowableValues = {"MOCK"})
    private String paymentMethod;

    private LocalDateTime paidAt;
    private Long enrollmentId;
    private LocalDateTime enrolledAt;
}
