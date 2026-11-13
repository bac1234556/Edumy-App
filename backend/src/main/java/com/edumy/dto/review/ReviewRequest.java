package com.edumy.dto.review;

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
public class ReviewRequest {

    @NotNull(message = "Số sao đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu là 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa là 5 sao")
    @Schema(description = "Số sao đánh giá từ 1 đến 5", example = "5")
    private Integer rating;

    @Schema(description = "Nội dung nhận xét về khóa học", example = "Khóa học rất chi tiết và dễ hiểu, thực hành tốt!")
    private String comment;
}
