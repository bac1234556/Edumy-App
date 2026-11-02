package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu tạo đơn mua khóa học")
public class CreateOrderRequest {

    @NotNull(message = "Vui lòng chọn khóa học")
    @Positive(message = "ID khóa học không hợp lệ")
    @Schema(description = "ID khóa học cần mua", example = "1")
    private Long courseId;

    @Pattern(regexp = "MOCK|VNPAY", message = "Phương thức thanh toán chỉ nhận MOCK hoặc VNPAY")
    @Schema(description = "Phương thức thanh toán (mặc định MOCK)", allowableValues = {"MOCK", "VNPAY"}, example = "MOCK")
    @Builder.Default
    private String paymentMethod = "MOCK";
}
