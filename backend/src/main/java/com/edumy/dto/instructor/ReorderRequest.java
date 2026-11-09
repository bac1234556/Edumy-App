package com.edumy.dto.instructor;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReorderRequest {
    @NotEmpty(message = "Danh sách sắp xếp không được rỗng")
    private List<ItemOrder> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemOrder {
        @NotNull(message = "ID mục không được để trống")
        @Schema(description = "ID mục cần sắp xếp", example = "1")
        private Long id;

        @NotNull(message = "orderIndex không được để trống")
        @Schema(description = "Thứ tự sắp xếp mới", example = "1")
        private Integer orderIndex;
    }
}
