package com.edumy.controller;

import com.edumy.entity.Notification;
import com.edumy.entity.NotificationType;
import com.edumy.entity.Role;
import com.edumy.entity.User;
import com.edumy.entity.UserStatus;
import com.edumy.repository.NotificationRepository;
import com.edumy.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;

    private User owner;
    private User other;

    @BeforeEach
    void setUp() {
        owner = user();
        other = user();
    }

    @Test
    void notificationsAreScopedToAuthenticatedUserAndCanBeMarkedReadIdempotently() throws Exception {
        Notification own = notificationRepository.save(notification(owner.getId(), false, "Thông báo của tôi"));
        notificationRepository.save(notification(other.getId(), false, "Không được lộ"));

        mockMvc.perform(get("/api/me/notifications").with(as(owner)).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].title").value("Thông báo của tôi"));

        mockMvc.perform(get("/api/me/notifications/unread-count").with(as(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(1));

        mockMvc.perform(patch("/api/me/notifications/{id}/read", own.getId()).with(as(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRead").value(true));
        mockMvc.perform(patch("/api/me/notifications/{id}/read", own.getId()).with(as(owner)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/me/notifications/unread-count").with(as(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));

        mockMvc.perform(patch("/api/me/notifications/{id}/read", own.getId()).with(as(other)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void readAllIsIdempotentAndDocumentedUnderMeRoute() throws Exception {
        notificationRepository.save(notification(owner.getId(), false, "A"));
        notificationRepository.save(notification(owner.getId(), false, "B"));

        mockMvc.perform(patch("/api/me/notifications/read-all").with(as(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.updatedCount").value(2));
        mockMvc.perform(patch("/api/me/notifications/read-all").with(as(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.updatedCount").value(0));

        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/me/notifications']").exists())
                .andExpect(jsonPath("$.paths['/api/me/notifications/unread-count']").exists());
    }

    private User user() {
        String suffix = UUID.randomUUID().toString();
        return userRepository.save(User.builder()
                .email("w9e3-" + suffix + "@edumy.test")
                .passwordHash("test-hash")
                .fullName("W9 E3 test")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build());
    }

    private RequestPostProcessor as(User user) {
        return authentication(new UsernamePasswordAuthenticationToken(
                user.getId(), null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))));
    }

    private Notification notification(Long userId, boolean isRead, String title) {
        return Notification.builder()
                .userId(userId)
                .type(NotificationType.COURSE_APPROVED)
                .title(title)
                .body("Nội dung " + title)
                .isRead(isRead)
                .build();
    }
}
