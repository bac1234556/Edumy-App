package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.admin.AdminStatsResponse;
import com.edumy.service.AdminStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/admin/stats", "/api/v1/admin/stats"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Dashboard API", description = "Tổng hợp số liệu dành riêng cho quản trị viên")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @GetMapping
    @Operation(summary = "Lấy số liệu dashboard quản trị", description = "Doanh thu là tổng amount của các order có trạng thái PAID; order PENDING và FAILED không được tính. Enrollment được nhóm theo tháng trong múi giờ Asia/Ho_Chi_Minh và trả đủ 6 tháng gần nhất, tháng không có dữ liệu có count bằng 0.")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(adminStatsService.getStats(), "Lấy số liệu dashboard thành công"));
    }
}
