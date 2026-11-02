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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class LearningControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static RequestPostProcessor student() {
        return authentication(new UsernamePasswordAuthenticationToken(
                1L, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    @Test
    @DisplayName("Chưa đăng nhập gọi POST /api/orders và GET /api/me/enrollments nhận 401")
    void requiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{\"courseId\":1}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
        mockMvc.perform(get("/api/me/enrollments"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/orders hợp lệ trả 201, đơn PENDING kèm txnRef và giá khóa học")
    void createOrderStub() throws Exception {
        mockMvc.perform(post("/api/orders").with(student())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseId\":1,\"paymentMethod\":\"MOCK\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.courseId").value(1))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.paymentMethod").value("MOCK"))
                .andExpect(jsonPath("$.data.txnRef", matchesPattern("EDU\\d{20}")))
                .andExpect(jsonPath("$.data.amount").isNumber());
    }

    @Test
    @DisplayName("POST /api/orders thiếu courseId hoặc sai paymentMethod trả 400 đúng format lỗi")
    void createOrderValidation() throws Exception {
        mockMvc.perform(post("/api/orders").with(student())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(jsonPath("$.errors[*].field", hasItem("courseId")));

        mockMvc.perform(post("/api/orders").with(student())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"courseId\":1,\"paymentMethod\":\"CASH\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("paymentMethod")));

        mockMvc.perform(post("/api/orders").with(student())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"courseId\":-5}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/me/enrollments trả danh sách khóa đã mua kèm tiến độ")
    void myEnrollmentsStub() throws Exception {
        mockMvc.perform(get("/api/me/enrollments").with(student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].progressPercent").value(33))
                .andExpect(jsonPath("$.data[1].progressPercent").value(100));
    }

    @Test
    @DisplayName("Hai endpoint stub có trên Swagger (/v3/api-docs)")
    void endpointsDocumentedOnSwagger() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/orders'].post").exists())
                .andExpect(jsonPath("$.paths['/api/me/enrollments'].get").exists());
    }
}
