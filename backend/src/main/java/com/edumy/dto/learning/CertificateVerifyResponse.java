package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Kết quả xác minh chứng chỉ (công khai, không cần đăng nhập)")
public class CertificateVerifyResponse {

    @Schema(description = "Luôn true khi mã tồn tại; mã không tồn tại trả 404")
    private Boolean valid;

    private String code;
    private String studentName;
    private String courseTitle;
    private String instructorName;
    private LocalDateTime issuedAt;
}
