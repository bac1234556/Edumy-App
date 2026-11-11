package com.edumy.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import java.util.Map;
import java.util.UUID;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ChangePasswordControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private ResultActions postJson(String path, Object body) throws Exception {
        return mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)));
    }
    private JsonNode data(ResultActions result) throws Exception {
        return mapper.readTree(result.andReturn().getResponse().getContentAsString()).get("data");
    }
    private JsonNode register(String email) throws Exception {
        return data(postJson("/api/auth/register", Map.of("email", email, "password", "Password123!",
                "fullName", "Password test", "role", "STUDENT")).andExpect(status().isCreated()));
    }
    private ResultActions change(String path, JsonNode session, String oldPassword, String newPassword) throws Exception {
        return mvc.perform(put(path).header("Authorization", "Bearer " + session.get("accessToken").asText())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("oldPassword", oldPassword, "newPassword", newPassword))));
    }
    @Test
    void changingPasswordRevokesEveryDeviceButLeavesOtherUsersAlone() throws Exception {
        String email = UUID.randomUUID() + "@example.com";
        JsonNode first = register(email);
        JsonNode second = data(postJson("/api/auth/login", Map.of("email", email, "password", "Password123!"))
                .andExpect(status().isOk()));
        JsonNode other = register(UUID.randomUUID() + "@example.com");
        change("/api/users/me/password", first, "Password123!", "NewPassword456!")
                .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true));
        for (JsonNode device : new JsonNode[]{first, second}) {
            postJson("/api/auth/refresh-token", Map.of("refreshToken", device.get("refreshToken").asText()))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.success").value(false));
        }
        postJson("/api/auth/refresh-token", Map.of("refreshToken", other.get("refreshToken").asText()))
                .andExpect(status().isOk());
        postJson("/api/auth/login", Map.of("email", email, "password", "Password123!"))
                .andExpect(status().isUnauthorized());
        JsonNode fresh = data(postJson("/api/auth/login", Map.of("email", email, "password", "NewPassword456!"))
                .andExpect(status().isOk()));
        change("/api/v1/users/me/password", fresh, "NewPassword456!", "AnotherPassword789!")
                .andExpect(status().isOk());
    }
    @Test
    void invalidChangesPreservePasswordAndRefreshToken() throws Exception {
        String email = UUID.randomUUID() + "@example.com";
        JsonNode session = register(email);
        for (String[] pair : new String[][]{{"wrong", "NewPassword456!"}, {"Password123!", "short"},
                {"Password123!", "Password123!"}, {"Password123!", "ắ".repeat(25)}, {"", "NewPassword456!"}}) {
            change("/api/users/me/password", session, pair[0], pair[1])
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").isNotEmpty());
        }
        postJson("/api/auth/login", Map.of("email", email, "password", "Password123!"))
                .andExpect(status().isOk());
        postJson("/api/auth/refresh-token", Map.of("refreshToken", session.get("refreshToken").asText()))
                .andExpect(status().isOk());
        mvc.perform(put("/api/users/me/password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"oldPassword\":\"Password123!\",\"newPassword\":\"NewPassword456!\"}"))
                .andExpect(status().isUnauthorized());
    }
}
