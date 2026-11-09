package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.admin.CategoryResponse;
import com.edumy.service.AdminCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/categories", "/api/v1/categories"})
@RequiredArgsConstructor
@Tag(name = "Category API", description = "Danh sách danh mục khóa học công khai")
@CrossOrigin(origins = "*")
public class CategoryPublicController {

    private final AdminCategoryService adminCategoryService;

    @GetMapping
    @Operation(summary = "Lấy danh sách danh mục khóa học")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(
                adminCategoryService.getAllCategories(),
                "Lấy danh sách danh mục thành công"
        ));
    }
}
