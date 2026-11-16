package com.edumy.service;

import com.edumy.dto.auth.*;
import com.edumy.entity.*;
import com.edumy.exception.ConflictException;
import com.edumy.exception.UnauthorizedException;
import com.edumy.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwords;
    private final JwtService jwt;
    private final SecureRandom random = new SecureRandom();

    public AuthResponse register(RegisterRequest request) {
        if (request.role() != Role.STUDENT && request.role() != Role.INSTRUCTOR)
            throw new IllegalArgumentException("Chỉ được đăng ký STUDENT hoặc INSTRUCTOR");
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("Mật khẩu không được vượt quá 72 byte UTF-8");
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email)) throw new ConflictException("Email đã được sử dụng");
        User user = users.saveAndFlush(User.builder().email(email)
                .passwordHash(passwords.encode(request.password())).fullName(request.fullName().strip())
                .role(request.role()).status(UserStatus.ACTIVE).build());
        return tokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = users.findLockedByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new UnauthorizedException("Email hoặc mật khẩu không đúng"));
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72
                || !passwords.matches(request.password(), user.getPasswordHash()))
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        requireActive(user);
        return tokens(user);
    }

    public AuthResponse refresh(String rawToken) {
        // Serialize token issuance and password changes on the same user row.
        // Always lock the user before the refresh token to avoid lock inversion.
        Long userId = refreshTokens.findUserIdByTokenHash(hash(rawToken))
                .orElseThrow(() -> new UnauthorizedException("Refresh token không hợp lệ"));
        User user = users.findLockedById(userId)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại"));
        RefreshToken token = refreshTokens.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new UnauthorizedException("Refresh token không hợp lệ"));
        if (token.getRevokedAt() != null || !token.getExpiresAt().isAfter(Instant.now()))
            throw new UnauthorizedException("Refresh token đã hết hạn hoặc bị thu hồi");
        requireActive(user);
        token.setRevokedAt(Instant.now());
        return tokens(user);
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = users.findLockedById(userId)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại"));
        requireActive(user);
        if (request.oldPassword().getBytes(StandardCharsets.UTF_8).length > 72
                || !passwords.matches(request.oldPassword(), user.getPasswordHash()))
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        if (request.newPassword().getBytes(StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("Mật khẩu không được vượt quá 72 byte UTF-8");
        if (passwords.matches(request.newPassword(), user.getPasswordHash()))
            throw new IllegalArgumentException("Mật khẩu mới phải khác mật khẩu hiện tại");
        user.setPasswordHash(passwords.encode(request.newPassword()));
        refreshTokens.revokeAllForUser(userId, Instant.now());
    }

    public void logout(String rawToken) {
        refreshTokens.findByTokenHash(hash(rawToken)).ifPresent(t -> t.setRevokedAt(Instant.now()));
    }

    private AuthResponse tokens(User user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshToken refresh = new RefreshToken();
        refresh.setUser(user);
        refresh.setTokenHash(hash(raw));
        refresh.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        refreshTokens.save(refresh);
        return new AuthResponse(jwt.issue(user), raw, "Bearer", jwt.expiresIn(), UserProfile.from(user));
    }

    private void requireActive(User user) {
        if (user.getStatus() != UserStatus.ACTIVE)
            throw new UnauthorizedException("Tài khoản đã bị khóa");
    }

    private String normalizeEmail(String email) { return email.strip().toLowerCase(Locale.ROOT); }

    static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
