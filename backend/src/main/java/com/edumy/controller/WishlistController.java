package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.course.CourseSummaryResponse;
import com.edumy.exception.UnauthorizedException;
import com.edumy.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Wishlist", description = "Quản lý khóa học yêu thích")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping({"/api/me/wishlist", "/api/v1/me/wishlist"})
    @Operation(summary = "Lấy danh sách khóa học trong danh sách yêu thích của tôi")
    public ResponseEntity<ApiResponse<List<CourseSummaryResponse>>> getMyWishlist(
            @AuthenticationPrincipal Long userId
    ) {
        ensureAuthenticated(userId);
        List<CourseSummaryResponse> response = wishlistService.getMyWishlist(userId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy danh sách yêu thích thành công"));
    }

    @GetMapping({"/api/me/wishlist/ids", "/api/v1/me/wishlist/ids"})
    @Operation(summary = "Lấy danh sách ID các khóa học đã yêu thích của tôi")
    public ResponseEntity<ApiResponse<List<Long>>> getMyWishlistCourseIds(
            @AuthenticationPrincipal Long userId
    ) {
        ensureAuthenticated(userId);
        List<Long> ids = wishlistService.getMyWishlistCourseIds(userId);
        return ResponseEntity.ok(ApiResponse.ok(ids, "Lấy danh sách ID yêu thích thành công"));
    }

    @PostMapping({"/api/me/wishlist/{courseId}", "/api/v1/me/wishlist/{courseId}"})
    @Operation(summary = "Thêm khóa học vào danh sách yêu thích (idempotent)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addToWishlist(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long courseId
    ) {
        ensureAuthenticated(userId);
        Map<String, Object> result = wishlistService.addToWishlist(userId, courseId);
        return ResponseEntity.ok(ApiResponse.ok(result, "Đã thêm khóa học vào danh sách yêu thích"));
    }

    @DeleteMapping({"/api/me/wishlist/{courseId}", "/api/v1/me/wishlist/{courseId}"})
    @Operation(summary = "Xóa khóa học khỏi danh sách yêu thích")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeFromWishlist(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long courseId
    ) {
        ensureAuthenticated(userId);
        Map<String, Object> result = wishlistService.removeFromWishlist(userId, courseId);
        return ResponseEntity.ok(ApiResponse.ok(result, "Đã xóa khóa học khỏi danh sách yêu thích"));
    }

    private void ensureAuthenticated(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
    }
}
