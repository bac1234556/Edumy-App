package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.common.PageResponse;
import com.edumy.dto.admin.UserResponse;
import com.edumy.entity.Role;
import com.edumy.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/admin/users", "/api/v1/admin/users"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin User API", description = "Quản trị danh sách người dùng (yêu cầu quyền ADMIN)")
@CrossOrigin(origins = "*")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(
            summary = "Lấy danh sách người dùng",
            description = "Hỗ trợ phân trang, tìm kiếm theo tên hoặc email, và lọc theo vai trò (STUDENT, INSTRUCTOR, ADMIN)."
    )
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @Parameter(description = "Từ khóa tìm kiếm theo họ tên hoặc email (tùy chọn)")
            @RequestParam(required = false) String keyword,

            @Parameter(description = "Lọc theo vai trò người dùng (STUDENT | INSTRUCTOR | ADMIN)")
            @RequestParam(required = false) Role role,

            @Parameter(description = "Số thứ tự trang (0-indexed, mặc định 0)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Số lượng người dùng trên mỗi trang (mặc định 10)")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Sắp xếp theo trường, ví dụ: 'createdAt,desc' hoặc 'fullName,asc'")
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        PageResponse<UserResponse> response = adminUserService.getUsers(keyword, role, pageable);

        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy danh sách người dùng thành công"));
    }
}
