package com.edumy.dto.admin;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu tạo hoặc cập nhật danh mục khóa học")
public class CategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên danh mục không được vượt quá 100 ký tự")
    @Schema(description = "Tên hiển thị của danh mục", example = "Trí tuệ nhân tạo (AI)")
    private String name;

    @Size(max = 120, message = "Slug không được vượt quá 120 ký tự")
    @Schema(description = "Đường dẫn định danh (nếu để trống hệ thống sẽ tự sinh từ tên)", example = "tri-tue-nhan-tao-ai")
    private String slug;

    @Size(max = 100, message = "Icon không được vượt quá 100 ký tự")
    @Schema(description = "Tên icon đại diện", example = "robot")
    private String icon;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    @Schema(description = "Mô tả ngắn về danh mục", example = "Các khóa học Machine Learning, Deep Learning, Generative AI")
    private String description;

    @Schema(description = "ID của danh mục cha (nếu có)", example = "1")
    private Long parentId;
}
