package com.edumy.service;

import com.edumy.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long accessSeconds;

    public JwtService(@Value("${jwt.secret:}") String secret,
                      @Value("${jwt.access-seconds:900}") long accessSeconds) {
        // No shared default signing secret. Set JWT_SECRET to retain sessions after restart.
        this.key = secret.isBlank() ? Jwts.SIG.HS256.key().build()
                : Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        if (accessSeconds <= 0) throw new IllegalArgumentException("JWT TTL must be positive");
        this.accessSeconds = accessSeconds;
    }

    public String issue(User user) {
        Instant now = Instant.now();
        return Jwts.builder().issuer("edumy").subject(user.getId().toString())
                .claim("type", "access").claim("role", user.getRole().name())
                .issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(accessSeconds)))
                .signWith(key).compact();
    }

    public Long userId(String token) {
        var claims = Jwts.parser().verifyWith(key).requireIssuer("edumy")
                .require("type", "access").build().parseSignedClaims(token).getPayload();
        return Long.valueOf(claims.getSubject());
    }

    public long expiresIn() { return accessSeconds; }
}
