package com.edumy.dto.auth;

public record AuthResponse(String accessToken, String refreshToken, String tokenType,
                           long expiresIn, UserProfile user) {}
