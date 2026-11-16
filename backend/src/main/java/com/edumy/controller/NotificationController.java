package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.common.PageResponse;
import com.edumy.dto.NotificationResponse;
import com.edumy.exception.UnauthorizedException;
import com.edumy.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/notifications", "/api/v1/notifications"})
@RequiredArgsConstructor
@Validated
@Tag(name = "Notification API", description = "Thông báo của người dùng đang đăng nhập")
@CrossOrigin(origins = "*")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Lấy thông báo của tài khoản hiện tại")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getMyNotifications(
            Authentication authentication,
            @Parameter(description = "Số thứ tự trang (0-indexed)")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Số lượng thông báo mỗi trang (tối đa 50)")
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size
    ) {
        Long userId = extractUserId(authentication);
        PageResponse<NotificationResponse> response = notificationService.getUserNotifications(
                userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy danh sách thông báo thành công"));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Lấy số lượng thông báo chưa đọc")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication authentication) {
        Long userId = extractUserId(authentication);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("unreadCount", count), "Lấy số lượng thông báo chưa đọc thành công"));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Đánh dấu một thông báo là đã đọc")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            Authentication authentication,
            @Parameter(description = "ID thông báo", required = true) @PathVariable @Min(1) Long id
    ) {
        Long userId = extractUserId(authentication);
        NotificationResponse response = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Đánh dấu thông báo đã đọc thành công"));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Đánh dấu toàn bộ thông báo là đã đọc")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllAsRead(Authentication authentication) {
        Long userId = extractUserId(authentication);
        int updated = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("updatedCount", updated), "Đánh dấu toàn bộ thông báo đã đọc thành công"));
    }

    private Long extractUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
            throw new UnauthorizedException("Không xác định được tài khoản hiện tại");
        }
        return userId;
    }
}
