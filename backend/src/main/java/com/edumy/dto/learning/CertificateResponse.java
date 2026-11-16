package com.edumy.dto.learning;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Chứng chỉ hoàn thành khóa học của học viên")
public class CertificateResponse {

    @Schema(description = "Mã chứng chỉ duy nhất", example = "EDUMY-2026-K7M2QX4P")
    private String code;

    private Long courseId;
    private String courseTitle;
    private String studentName;
    private String instructorName;
    @Schema(description = "Thời điểm cấp (kèm múi giờ)", example = "2026-11-16T19:00:00Z")
    private OffsetDateTime issuedAt;

    @Schema(description = "Đường dẫn tải PDF (cần đăng nhập, chỉ chủ chứng chỉ)", example = "/api/certificates/EDUMY-2026-K7M2QX4P/pdf")
    private String pdfPath;
}
