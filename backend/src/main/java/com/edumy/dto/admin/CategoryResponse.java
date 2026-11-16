package com.edumy.dto.admin;

import com.edumy.entity.Category;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin chi tiết của danh mục")
public class CategoryResponse {

    @Schema(description = "ID danh mục", example = "1")
    private Long id;

    @Schema(description = "Tên danh mục", example = "Lập trình & CNTT")
    private String name;

    @Schema(description = "Slug duy nhất", example = "lap-trinh-cntt")
    private String slug;

    @Schema(description = "Icon đại diện", example = "code-tags")
    private String icon;

    @Schema(description = "Mô tả danh mục", example = "Các khóa học phát triển phần mềm, web, mobile...")
    private String description;

    @Schema(description = "ID danh mục cha", example = "null")
    private Long parentId;

    @Schema(description = "Số lượng khóa học thuộc danh mục này", example = "12")
    private long courseCount;

    @Schema(description = "Thời gian tạo")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian cập nhật gần nhất")
    private LocalDateTime updatedAt;

    public static CategoryResponse from(Category category, long courseCount) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .icon(category.getIcon())
                .description(category.getDescription())
                .parentId(category.getParentId())
                .courseCount(courseCount)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
