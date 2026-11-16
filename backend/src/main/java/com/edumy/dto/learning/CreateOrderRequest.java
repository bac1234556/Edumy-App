package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu checkout khóa học")
public class CreateOrderRequest {

    @NotNull(message = "Vui lòng chọn khóa học")
    @Positive(message = "ID khóa học không hợp lệ")
    @Schema(description = "ID khóa học cần mua", example = "1")
    private Long courseId;

    @Pattern(regexp = "MOCK|VNPAY", message = "Phương thức thanh toán chỉ nhận MOCK hoặc VNPAY")
    @Schema(description = "Phương thức thanh toán. Có thể bỏ trống: server dùng cổng đang bật (payment.provider). " +
            "Nếu gửi thì phải trùng với cổng đang bật.", allowableValues = {"MOCK", "VNPAY"}, example = "MOCK")
    private String paymentMethod;

    @Size(max = 500, message = "Địa chỉ quay về app quá dài")
    @Schema(description = "Deep link để trang thanh toán VNPay quay về app (edumy://... hoặc exp://... khi chạy Expo Go)",
            example = "edumy://payment-result")
    private String returnUri;
}
