package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Lưu vị trí xem của một bài học")
public class SaveProgressRequest {

    @NotNull(message = "Vui lòng gửi vị trí đang xem (positionSec)")
    @Min(value = 0, message = "Vị trí xem không được âm")
    @Max(value = 86_400, message = "Vị trí xem không hợp lệ")
    @Schema(description = "Vị trí đang xem, tính bằng giây", example = "95")
    private Integer positionSec;

    @Schema(description = "true khi học viên bấm hoàn thành (bài TEXT) hoặc đã xem hết; " +
            "server cũng tự đánh dấu hoàn thành khi xem từ 90% thời lượng. Không thể bỏ hoàn thành.", example = "false")
    private Boolean completed;
}
