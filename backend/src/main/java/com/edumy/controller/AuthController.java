package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.auth.*;
import com.edumy.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;

    @Operation(summary = "Register as STUDENT or INSTRUCTOR")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(auth.register(request), "Đăng ký thành công");
    }

    @Operation(summary = "Login with email and password")
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(auth.login(request));
    }

    @Operation(summary = "Rotate a refresh token and issue new access token")
    @PostMapping({"/refresh", "/refresh-token"})
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok(auth.refresh(request.refreshToken()));
    }

    @Operation(summary = "Revoke a refresh token")
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshRequest request) {
        auth.logout(request.refreshToken());
        return ApiResponse.ok(null, "Đã đăng xuất");
    }
}
