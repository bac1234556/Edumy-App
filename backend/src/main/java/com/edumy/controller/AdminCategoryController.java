package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.admin.CategoryRequest;
import com.edumy.dto.admin.CategoryResponse;
import com.edumy.service.AdminCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/categories", "/api/v1/admin/categories"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Category API", description = "CRUD danh mục khóa học dành cho Quản trị viên (yêu cầu quyền ADMIN)")
@CrossOrigin(origins = "*")
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    @GetMapping
    @Operation(
            summary = "Lấy toàn bộ danh mục khóa học",
            description = "Trả về danh sách danh mục kèm số lượng khóa học liên kết."
    )
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> response = adminCategoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy danh sách danh mục thành công"));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Lấy chi tiết một danh mục theo ID",
            description = "Trả về thông tin chi tiết danh mục hoặc 404 nếu không tồn tại."
    )
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(
            @Parameter(description = "ID danh mục", required = true)
            @PathVariable Long id
    ) {
        CategoryResponse response = adminCategoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy chi tiết danh mục thành công"));
    }

    @PostMapping
    @Operation(
            summary = "Tạo mới danh mục khóa học",
            description = "Tạo danh mục mới. Nếu không truyền slug, hệ thống sẽ tự sinh slug từ name."
    )
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryRequest request
    ) {
        CategoryResponse response = adminCategoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Tạo danh mục thành công"));
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Cập nhật thông tin danh mục",
            description = "Cập nhật tên, icon, mô tả, slug hoặc danh mục cha."
    )
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @Parameter(description = "ID danh mục cần cập nhật", required = true)
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request
    ) {
        CategoryResponse response = adminCategoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật danh mục thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Xóa danh mục khóa học",
            description = "Xóa danh mục theo ID. BẢO VỆ: Nếu danh mục đang có khóa học hoặc danh mục con, trả về HTTP 409 Conflict."
    )
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @Parameter(description = "ID danh mục cần xóa", required = true)
            @PathVariable Long id
    ) {
        adminCategoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa danh mục thành công"));
    }
}
