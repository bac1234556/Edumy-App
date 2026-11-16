package com.edumy.controller;

import com.edumy.entity.Course;
import com.edumy.entity.CourseStatus;
import com.edumy.entity.Role;
import com.edumy.entity.User;
import com.edumy.entity.UserStatus;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.UserRepository;
import com.edumy.repository.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class WishlistControllerTest {

    private static final AtomicLong NEXT_USER = new AtomicLong(700_000);

    @Autowired private MockMvc mockMvc;
    @Autowired private CourseRepository courseRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private WishlistRepository wishlistRepository;

    private Long studentId;
    private Long courseId;

    @BeforeEach
    void setUp() {
        studentId = NEXT_USER.incrementAndGet();
        userRepository.save(User.builder()
                .id(studentId)
                .email("student." + studentId + "@edumy.vn")
                .passwordHash("$2a$10$hashedpassword")
                .fullName("Học viên Wishlist")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build());

        Course course = courseRepository.save(Course.builder()
                .instructorId(studentId)
                .categoryId(1L)
                .title("Khóa học Wishlist Test")
                .price(new BigDecimal("150000.00"))
                .status(CourseStatus.PUBLISHED)
                .build());
        courseId = course.getId();
    }

    private RequestPostProcessor studentAuth() {
        return authentication(new UsernamePasswordAuthenticationToken(
                studentId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    @Test
    @DisplayName("Chưa đăng nhập gọi wishlist nhận 401")
    void requiresAuth() throws Exception {
        mockMvc.perform(get("/api/me/wishlist"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/me/wishlist/" + courseId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Thêm vào wishlist idempotent (bấm nhiều lần không trùng)")
    void addWishlistIdempotent() throws Exception {
        // Lần 1
        mockMvc.perform(post("/api/me/wishlist/" + courseId).with(studentAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.wishlisted").value(true));

        assertTrue(wishlistRepository.existsByUserIdAndCourseId(studentId, courseId));

        // Lần 2 (idempotent, không lỗi, không duplicate)
        mockMvc.perform(post("/api/me/wishlist/" + courseId).with(studentAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.wishlisted").value(true));

        assertEquals(1, wishlistRepository.findByUserId(studentId).size());
    }

    @Test
    @DisplayName("Lấy danh sách và xóa khỏi wishlist")
    void getAndDeleteWishlist() throws Exception {
        // Thêm khóa học
        mockMvc.perform(post("/api/me/wishlist/" + courseId).with(studentAuth()))
                .andExpect(status().isOk());

        // Lấy danh sách ID
        mockMvc.perform(get("/api/me/wishlist/ids").with(studentAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasItem(courseId.intValue())));

        // Lấy danh sách khóa học
        mockMvc.perform(get("/api/me/wishlist").with(studentAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id").value(courseId));

        // Xóa khỏi wishlist
        mockMvc.perform(delete("/api/me/wishlist/" + courseId).with(studentAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.wishlisted").value(false));

        assertFalse(wishlistRepository.existsByUserIdAndCourseId(studentId, courseId));
    }
}
