package com.edumy.controller;

import com.edumy.entity.*;
import com.edumy.repository.UserRepository;
import com.edumy.repository.RefreshTokenRepository;
import com.edumy.service.JwtService;
import com.fasterxml.jackson.databind.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "jwt.secret=edumy-test-signing-key-only-for-integration-tests-123456")
@AutoConfigureMockMvc
class AuthControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtService jwt;

    private String email() { return UUID.randomUUID() + "@example.com"; }

    private ResultActions postJson(String path, Object data) throws Exception {
        return mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(data)));
    }

    private JsonNode register(String email, Role role) throws Exception {
        return mapper.readTree(postJson("/api/auth/register", Map.of("email", email,
                        "password", "Password123!", "fullName", "Test User", "role", role))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("data");
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"STUDENT", "INSTRUCTOR"})
    void registrationHashesPasswordAndMeOmitsCredentials(Role role) throws Exception {
        String email = email();
        JsonNode result = register(email.toUpperCase(Locale.ROOT), role);
        User user = users.findByEmail(email).orElseThrow();
        assertNotEquals("Password123!", user.getPasswordHash());
        assertTrue(passwords.matches("Password123!", user.getPasswordHash()));
        assertEquals(role, user.getRole());
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + result.get("accessToken").asText()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.role").value(role.name()))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
    }

    @Test
    void cannotRegisterAdminOrDuplicateEmailOrInvalidFields() throws Exception {
        String email = email();
        register(email, Role.STUDENT);
        postJson("/api/auth/register", Map.of("email", email, "password", "Password123!",
                        "fullName", "Test", "role", "ADMIN"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.data").value((Object) null));
        postJson("/api/auth/register", Map.of("email", email.toUpperCase(Locale.ROOT), "password", "Password123!",
                        "fullName", "Test", "role", "STUDENT"))
                .andExpect(status().isConflict());
        postJson("/api/auth/register", Map.of("email", "invalid", "password", "short",
                        "fullName", "", "role", "STUDENT"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors").isArray());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginRefreshRotationAndLogout() throws Exception {
        String email = email();
        register(email, Role.STUDENT);
        JsonNode login = mapper.readTree(postJson("/api/auth/login", Map.of("email", email,
                        "password", "Password123!"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("data");
        String oldRefresh = login.get("refreshToken").asText();
        JsonNode refreshed = mapper.readTree(postJson("/api/auth/refresh", Map.of("refreshToken", oldRefresh))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("data");
        assertNotEquals(oldRefresh, refreshed.get("refreshToken").asText());
        assertTrue(refreshTokens.findAll().stream().noneMatch(t -> t.getTokenHash().equals(oldRefresh)));
        postJson("/api/auth/refresh", Map.of("refreshToken", oldRefresh)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + refreshed.get("accessToken").asText()))
                .andExpect(status().isOk());
        postJson("/api/auth/logout", Map.of("refreshToken", refreshed.get("refreshToken").asText()))
                .andExpect(status().isOk());
        postJson("/api/auth/refresh", Map.of("refreshToken", refreshed.get("refreshToken").asText()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void wrongPasswordAndUnknownOrExpiredRefreshReturn401() throws Exception {
        String email = email();
        JsonNode registered = register(email, Role.STUDENT);
        postJson("/api/auth/login", Map.of("email", email, "password", "wrong-password"))
                .andExpect(status().isUnauthorized());
        postJson("/api/auth/login", Map.of("email", email(), "password", "wrong-password"))
                .andExpect(status().isUnauthorized());
        postJson("/api/auth/refresh", Map.of("refreshToken", "unknown")).andExpect(status().isUnauthorized());
        var tokens = refreshTokens.findAll();
        tokens.forEach(t -> t.setExpiresAt(Instant.now().minusSeconds(1)));
        refreshTokens.saveAll(tokens);
        postJson("/api/auth/refresh", Map.of("refreshToken", registered.get("refreshToken").asText()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void roleChecksExpiredTokenAndForgedHeaders() throws Exception {
        JsonNode result = register(email(), Role.STUDENT);
        String token = result.get("accessToken").asText();
        for (String path : List.of("/api/admin/users", "/api/admin/categories", "/api/instructor/courses",
                "/api/v1/admin/users", "/api/v1/instructor/courses")) {
            mvc.perform(get(path).header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden()).andExpect(jsonPath("$.success").value(false));
        }
        String expired = Jwts.builder().issuer("edumy").subject(result.get("user").get("id").asText())
                .claim("type", "access").expiration(Date.from(Instant.now().minusSeconds(60)))
                .signWith(Keys.hmacShaKeyFor("edumy-test-signing-key-only-for-integration-tests-123456"
                        .getBytes(StandardCharsets.UTF_8))).compact();
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/users").header("X-User-Role", "ADMIN"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer admin-token"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void blockedUsersCannotLoginRefreshOrUseAccessToken() throws Exception {
        String email = email();
        JsonNode result = register(email, Role.STUDENT);
        User user = users.findByEmail(email).orElseThrow();
        user.setStatus(UserStatus.LOCKED);
        users.save(user);
        postJson("/api/auth/login", Map.of("email", email, "password", "Password123!"))
                .andExpect(status().isUnauthorized());
        postJson("/api/auth/refresh", Map.of("refreshToken", result.get("refreshToken").asText()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + result.get("accessToken").asText()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void realAdminJwtCanAccessAdminApi() throws Exception {
        User admin = users.save(User.builder().email(email()).fullName("Admin")
                .passwordHash(passwords.encode("Password123!")).role(Role.ADMIN).status(UserStatus.ACTIVE).build());
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + jwt.issue(admin)))
                .andExpect(status().isOk());
    }
}
