package com.edumy.dto.instructor;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin chữ ký Cloudinary để upload trực tiếp từ client")
public class CloudinarySignatureResponse {

    @Schema(description = "Chữ ký mã hóa", example = "a1b2c3d4e5f6...")
    private String signature;

    @Schema(description = "Timestamp tại thời điểm tạo chữ ký (giây)", example = "1731138000")
    private long timestamp;

    @Schema(description = "API Key của Cloudinary", example = "123456789012345")
    private String apiKey;

    @Schema(description = "Tên Cloud của tài khoản Cloudinary", example = "edumy_cloud")
    private String cloudName;

    @Schema(description = "Thư mục lưu trữ trên Cloudinary", example = "edumy/courses")
    private String folder;
}