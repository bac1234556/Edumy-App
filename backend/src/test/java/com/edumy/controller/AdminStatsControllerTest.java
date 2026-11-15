package com.edumy.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminStatsControllerTest {

    @Autowired private MockMvc mockMvc;

    @Test
    void onlyAdminsCanReadStatsAndResponseHasSixMonths() throws Exception {
        mockMvc.perform(get("/api/admin/stats").with(user("student").roles("STUDENT")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/admin/stats").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.usersByRole.STUDENT").isNumber())
                .andExpect(jsonPath("$.data.usersByStatus.LOCKED").isNumber())
                .andExpect(jsonPath("$.data.revenue").isNumber())
                .andExpect(jsonPath("$.data.enrollmentsLast6Months.length()").value(6))
                .andExpect(jsonPath("$.data.enrollmentsLast6Months[0].month").value(org.hamcrest.Matchers.matchesPattern("\\d{4}-\\d{2}")))
                .andExpect(jsonPath("$.data.enrollmentsLast6Months[0].count").isNumber());
    }

    @Test
    void statsEndpointIsDocumented() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/admin/stats'].get").exists());
    }
}
