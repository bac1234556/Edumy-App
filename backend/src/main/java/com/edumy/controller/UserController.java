package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.auth.UserProfile;
import com.edumy.exception.UnauthorizedException;
import com.edumy.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {
    private final UserRepository users;

    @Operation(summary = "Get current user profile")
    @GetMapping({"/api/users/me", "/api/v1/users/me"})
    public ApiResponse<UserProfile> me(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(UserProfile.from(users.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại"))));
    }
}
