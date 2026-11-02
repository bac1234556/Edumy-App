package com.edumy.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class AdminAuthFilter extends OncePerRequestFilter {

    @Value("${jwt.secret:default-secret-key-must-be-at-least-256-bits-long-for-hmac-sha256}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String roleHeader = request.getHeader("X-User-Role");
        String emailHeader = request.getHeader("X-User-Email");

        String role = null;
        String principal = "anonymousUser";

        // 1. Kiểm tra Bearer Token (nếu có)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            try {
                // Thử giải mã nếu là JWT chuẩn
                Claims claims = Jwts.parser()
                        .setSigningKey(jwtSecret.getBytes())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                principal = claims.getSubject() != null ? claims.getSubject() : claims.get("email", String.class);
                role = claims.get("role", String.class);
            } catch (Exception e) {
                // Token không phải JWT đã ký (ví dụ mock token)
                if ("admin-token".equalsIgnoreCase(token)) {
                    role = "ADMIN";
                    principal = "admin@edumy.vn";
                } else if ("user-token".equalsIgnoreCase(token) || "student-token".equalsIgnoreCase(token)) {
                    role = "STUDENT";
                    principal = "student@edumy.vn";
                }
            }
        }

        // 2. Hỗ trợ header X-User-Role cho môi trường dev/test khi Auth API (W7-A4) chưa hoàn thiện
        if (role == null && roleHeader != null && !roleHeader.isBlank()) {
            role = roleHeader.trim().toUpperCase();
            if (emailHeader != null && !emailHeader.isBlank()) {
                principal = emailHeader.trim();
            } else {
                principal = role.equalsIgnoreCase("ADMIN") ? "admin@edumy.vn" : "user@edumy.vn";
            }
        }

        // 3. Nếu xác định được role, gán quyền vào SecurityContext
        if (role != null) {
            String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    List.of(new SimpleGrantedAuthority(authority))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Authenticated principal='{}' with authority='{}'", principal, authority);
        }

        filterChain.doFilter(request, response);
    }
}
