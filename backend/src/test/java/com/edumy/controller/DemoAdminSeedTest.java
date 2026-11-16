package com.edumy.controller;

import com.edumy.entity.*;
import com.edumy.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DemoAdminSeedTest {
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @Autowired DataSource dataSource;
    @Autowired EntityManager entityManager;
    @Autowired MockMvc mvc;

    private void migrate(String hash) {
        users.saveAndFlush(User.builder().email("admin@edumy.vn").fullName("Demo Admin")
                .passwordHash(hash).role(Role.ADMIN).status(UserStatus.ACTIVE).build());
        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V20261102_02__fix_legacy_admin_demo_hash.sql")).execute(dataSource);
        entityManager.clear();
    }

    @Test
    void legacyDemoAccountCanLoginAfterMigration() throws Exception {
        migrate("$2a$12$tuKF7t9/2TSLLDLAqz5SJeuBWRthVPt6kWpHLJ6nItFRuTG.T0.PO");
        mvc.perform(post("/api/auth/login").contentType("application/json")
                        .content("{\"email\":\"admin@edumy.vn\",\"password\":\"Admin@123456\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.user.role").value("ADMIN"));
    }

    @Test
    void customizedAdminCredentialsArePreserved() {
        String customized = passwords.encode("CustomizedForTest123!");
        migrate(customized);
        String actual = users.findByEmail("admin@edumy.vn").orElseThrow().getPasswordHash();
        assertEquals(customized, actual);
        assertTrue(passwords.matches("CustomizedForTest123!", actual));
        assertFalse(passwords.matches("Admin@123456", actual));
    }
}
