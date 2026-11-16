package com.edumy.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class InstructorCourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static RequestPostProcessor instructor(Long id) {
        return authentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))));
    }

    private static RequestPostProcessor student(Long id) {
        return authentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    @Test
    @DisplayName("Chưa đăng nhập gọi GET /api/instructor/courses nhận 401")
    void requiresAuth() throws Exception {
        mockMvc.perform(get("/api/instructor/courses"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Student gọi API instructor nhận 403 Forbidden")
    void studentForbidden() throws Exception {
        mockMvc.perform(get("/api/instructor/courses").with(student(2L)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Instructor gọi GET /api/instructor/courses nhận 200 OK")
    void getMyCoursesSuccess() throws Exception {
        mockMvc.perform(get("/api/instructor/courses").with(instructor(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("POST /api/instructor/media/signature sinh chữ ký upload Cloudinary")
    void getCloudinarySignature() throws Exception {
        mockMvc.perform(post("/api/instructor/media/signature").with(instructor(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.signature").isString())
                .andExpect(jsonPath("$.data.timestamp").isNumber());
    }
}
