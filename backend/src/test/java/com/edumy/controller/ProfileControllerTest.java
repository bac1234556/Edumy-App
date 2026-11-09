package com.edumy.controller;

import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import java.io.ByteArrayOutputStream;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"app.avatar-directory=${java.io.tmpdir}/edumy-test-avatars"})
@AutoConfigureMockMvc
class ProfileControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private JsonNode account(String role) throws Exception {
        var body = Map.of("email", UUID.randomUUID()+"@example.com", "password", "Password123!", "fullName", "Original", "role", role);
        return mapper.readTree(mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body))).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("data");
    }

    @ParameterizedTest
    @ValueSource(strings = {"STUDENT", "INSTRUCTOR"})
    void updatesOwnProfileAndKeepsIdentityAndOtherUserUnchanged(String role) throws Exception {
        var account = account(role);
        var other = account("STUDENT");
        String token = "Bearer " + account.get("accessToken").asText();
        mvc.perform(put("/api/v1/users/me").header("Authorization",token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\" New Name \",\"bio\":\"Hello\",\"avatarUrl\":\"https://example.com/avatar.png\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("New Name"))
                .andExpect(jsonPath("$.data.role").value(role))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
        mvc.perform(get("/api/v1/users/me").header("Authorization",token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.bio").value("Hello"));
        mvc.perform(get("/api/v1/users/me").header("Authorization","Bearer " + other.get("accessToken").asText()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.fullName").value("Original"));
    }

    @Test
    void rejectsAnonymousAndInvalidInput() throws Exception {
        mvc.perform(put("/api/v1/users/me").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        String token = "Bearer " + account("STUDENT").get("accessToken").asText();
        for (String body : List.of("{\"fullName\":\" \"}", "{\"fullName\":\"User\",\"avatarUrl\":\"file:///etc/passwd\"}")) {
            mvc.perform(put("/api/v1/users/me").header("Authorization",token).contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.success").value(false));
        }
    }

    @Test
    void avatarRequiresAuthAndRejectsNonImagesAndServesUploadedImage() throws Exception {
        var bad = new MockMultipartFile("file", "test.png", "image/png", "not an image".getBytes());
        mvc.perform(multipart("/api/v1/users/me/avatar").file(bad)).andExpect(status().isUnauthorized());
        String token = "Bearer " + account("STUDENT").get("accessToken").asText();
        mvc.perform(multipart("/api/v1/users/me/avatar").file(bad).header("Authorization",token))
                .andExpect(status().isBadRequest());
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2,2,BufferedImage.TYPE_INT_RGB), "png", bytes);
        var file = new MockMultipartFile("file", "../../avatar.png", "image/png", bytes.toByteArray());
        String response = mvc.perform(multipart("/api/v1/users/me/avatar").file(file).header("Authorization",token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String url = mapper.readTree(response).get("data").get("avatarUrl").asText();
        assertTrue(url.matches("/api/avatars/[a-f0-9-]+\\.png"));
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().contentType(MediaType.IMAGE_PNG));
    }
}
