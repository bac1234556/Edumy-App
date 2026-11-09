package com.edumy.dto.admin;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RejectCourseRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(max = 2000, message = "Lý do từ chối không được vượt quá 2000 ký tự")
    @Schema(description = "Lý do từ chối khóa học", example = "Vui lòng bổ sung nội dung chi tiết cho chương 2")
    private String rejectionReason;
}
