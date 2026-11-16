package com.edumy.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class InstructorStatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static RequestPostProcessor instructor() {
        return authentication(new UsernamePasswordAuthenticationToken(
                1L, null, List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))));
    }

    @Test
    @DisplayName("GET /api/instructor/stats trả về đủ bốn chỉ số trong ApiResponse")
    void getInstructorStatsReturnsExpectedResponse() throws Exception {
        mockMvc.perform(get("/api/instructor/stats").with(instructor()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.data.totalCourses").isNumber())
                .andExpect(jsonPath("$.data.totalStudents").isNumber())
                .andExpect(jsonPath("$.data.totalRevenue").isNumber())
                .andExpect(jsonPath("$.data.averageRating").isNumber());
    }

    @Test
    @DisplayName("GET danh sách học viên từ chối page âm")
    void getCourseStudentsRejectsNegativePage() throws Exception {
        mockMvc.perform(get("/api/instructor/courses/1/students")
                        .param("page", "-1")
                        .with(instructor()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").isString());
    }

    @Test
    @DisplayName("GET danh sách học viên từ chối size lớn hơn 50")
    void getCourseStudentsRejectsSizeAboveMaximum() throws Exception {
        mockMvc.perform(get("/api/instructor/courses/1/students")
                        .param("size", "51")
                        .with(instructor()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET danh sách học viên từ chối course ID không dương")
    void getCourseStudentsRejectsNonPositiveCourseId() throws Exception {
        mockMvc.perform(get("/api/instructor/courses/0/students").with(instructor()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET API thống kê yêu cầu đăng nhập")
    void getInstructorStatsRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/instructor/stats"))
                .andExpect(status().isUnauthorized());
    }
}
