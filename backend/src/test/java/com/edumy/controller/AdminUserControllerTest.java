package com.edumy.controller;

import com.edumy.entity.Role;
import com.edumy.entity.User;
import com.edumy.entity.UserStatus;
import com.edumy.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        if (!userRepository.existsByEmail("test.student@edumy.vn")) {
            userRepository.save(User.builder()
                    .email("test.student@edumy.vn")
                    .passwordHash("$2a$10$hashedpassword")
                    .fullName("Nguyễn Văn Học Viên")
                    .role(Role.STUDENT)
                    .status(UserStatus.ACTIVE)
                    .build());
        }
    }

    @Test
    @DisplayName("Acceptance Criteria 1: User không phải admin gọi GET /api/admin/users nhận 403")
    void testNonAdminAccessUsersReturns403() throws Exception {
        // Không có role
        mockMvc.perform(get("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        // Role STUDENT
        mockMvc.perform(get("/api/admin/users")
                        .header("X-User-Role", "STUDENT")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Admin lấy danh sách người dùng thành công có phân trang (200 OK)")
    void testAdminGetUsers() throws Exception {
        mockMvc.perform(get("/api/admin/users?page=0&size=10")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(10));
    }

    @Test
    @DisplayName("Admin tìm kiếm người dùng theo từ khóa và lọc theo Role")
    void testAdminSearchAndFilterUsers() throws Exception {
        mockMvc.perform(get("/api/admin/users?keyword=Học Viên&role=STUDENT&page=0&size=5")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }
}
