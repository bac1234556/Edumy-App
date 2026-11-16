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
@Schema(description = "Yêu cầu checkout khóa học")
public class CreateOrderRequest {

    @NotNull(message = "Vui lòng chọn khóa học")
    @Positive(message = "ID khóa học không hợp lệ")
    @Schema(description = "ID khóa học cần mua", example = "1")
    private Long courseId;

    @Pattern(regexp = "MOCK", message = "Hiện chỉ hỗ trợ phương thức thanh toán MOCK")
    @Schema(description = "Phương thức thanh toán (W8 chỉ hỗ trợ MOCK)", allowableValues = {"MOCK"}, example = "MOCK")
    @Builder.Default
    private String paymentMethod = "MOCK";
}
