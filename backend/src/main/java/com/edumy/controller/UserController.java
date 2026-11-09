package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.profile.UserResponse;
import com.edumy.dto.profile.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import com.edumy.exception.UnauthorizedException;
import com.edumy.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {
    private final UserRepository users;

    @Operation(summary = "Get current user profile")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping({"/api/users/me", "/api/v1/users/me"})
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(UserResponse.from(users.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại"))));
    }

    @Operation(summary = "Update current user name, biography and avatar")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping({"/api/users/me", "/api/v1/users/me"})
    @Transactional
    public ApiResponse<UserResponse> update(@AuthenticationPrincipal Long userId,
                                           @Valid @RequestBody UpdateProfileRequest request) {
        var user = users.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại"));
        user.setFullName(request.fullName().strip());
        user.setBio(request.bio() == null ? null : request.bio().strip());
        user.setAvatarUrl(request.avatarUrl());
        return ApiResponse.ok(UserResponse.from(users.save(user)));
    }
}
