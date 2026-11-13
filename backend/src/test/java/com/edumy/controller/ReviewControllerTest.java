package com.edumy.controller;

import com.edumy.entity.*;
import com.edumy.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ReviewControllerTest {

    private static final AtomicLong NEXT_USER = new AtomicLong(800_000);

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CourseRepository courseRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private ReviewRepository reviewRepository;

    private Long studentId;
    private Long courseId;

    @BeforeEach
    void setUp() {
        studentId = NEXT_USER.incrementAndGet();
        User student = userRepository.save(User.builder()
                .id(studentId)
                .email("student." + studentId + "@edumy.vn")
                .passwordHash("$2a$10$hashedpassword")
                .fullName("Học viên Test")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build());

        User instructor = userRepository.findByEmail("review.instructor@edumy.vn").orElseGet(() ->
                userRepository.save(User.builder()
                        .email("review.instructor@edumy.vn")
                        .passwordHash("$2a$10$hashedpassword")
                        .fullName("Giảng viên Review")
                        .role(Role.INSTRUCTOR)
                        .status(UserStatus.ACTIVE)
                        .build()));

        Course course = courseRepository.save(Course.builder()
                .instructorId(instructor.getId())
                .categoryId(1L)
                .title("Khóa học Review Test")
                .price(new BigDecimal("199000.00"))
                .status(CourseStatus.PUBLISHED)
                .avgRating(0.0)
                .ratingCount(0)
                .build());
        courseId = course.getId();
    }

    private RequestPostProcessor studentAuth() {
        return authentication(new UsernamePasswordAuthenticationToken(
                studentId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    @Test
    @DisplayName("Chưa đăng nhập gửi đánh giá nhận 401")
    void createReviewRequiresAuth() throws Exception {
        Map<String, Object> req = Map.of("rating", 5, "comment", "Khóa học rất tốt");
        mockMvc.perform(post("/api/courses/" + courseId + "/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Học viên chưa mua khóa đánh giá nhận 403 Forbidden")
    void unenrolledStudentCannotReview() throws Exception {
        Map<String, Object> req = Map.of("rating", 5, "comment", "Khóa học rất tốt");
        mockMvc.perform(post("/api/courses/" + courseId + "/reviews")
                        .with(studentAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Học viên đã enroll đánh giá thành công (201) và cập nhật avg_rating, rating_count")
    void enrolledStudentCanReviewAndUpdateCourseStats() throws Exception {
        enrollmentRepository.save(Enrollment.builder()
                .userId(studentId)
                .courseId(courseId)
                .progressPercent(50)
                .build());

        Map<String, Object> req = Map.of("rating", 5, "comment", "Khóa học tuyệt vời!");
        mockMvc.perform(post("/api/courses/" + courseId + "/reviews")
                        .with(studentAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.comment").value("Khóa học tuyệt vời!"));

        Course updated = courseRepository.findById(courseId).orElseThrow();
        assertEquals(5.0, updated.getAvgRating());
        assertEquals(1, updated.getRatingCount());

        // Đánh giá lần 2 bị 400 Bad Request
        mockMvc.perform(post("/api/courses/" + courseId + "/reviews")
                        .with(studentAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Cập nhật và xóa đánh giá")
    void updateAndDeleteReview() throws Exception {
        enrollmentRepository.save(Enrollment.builder()
                .userId(studentId)
                .courseId(courseId)
                .progressPercent(50)
                .build());

        reviewRepository.save(Review.builder()
                .userId(studentId)
                .courseId(courseId)
                .rating(5)
                .comment("Ban đầu cho 5 sao")
                .build());

        // Update to 4 stars
        Map<String, Object> updateReq = Map.of("rating", 4, "comment", "Sửa lại thành 4 sao");
        mockMvc.perform(put("/api/courses/" + courseId + "/reviews")
                        .with(studentAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rating").value(4));

        Course courseAfterUpdate = courseRepository.findById(courseId).orElseThrow();
        assertEquals(4.0, courseAfterUpdate.getAvgRating());

        // Delete review
        mockMvc.perform(delete("/api/courses/" + courseId + "/reviews")
                        .with(studentAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertFalse(reviewRepository.existsByUserIdAndCourseId(studentId, courseId));
        Course courseAfterDelete = courseRepository.findById(courseId).orElseThrow();
        assertEquals(0.0, courseAfterDelete.getAvgRating());
        assertEquals(0, courseAfterDelete.getRatingCount());
    }

    @Test
    @DisplayName("Lấy danh sách đánh giá trả về phân bố số sao")
    void getReviewsWithDistribution() throws Exception {
        reviewRepository.save(Review.builder().userId(studentId).courseId(courseId).rating(5).comment("Hay").build());

        mockMvc.perform(get("/api/courses/" + courseId + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalReviews").value(1))
                .andExpect(jsonPath("$.data.distribution.star5").value(1))
                .andExpect(jsonPath("$.data.distribution.star4").value(0))
                .andExpect(jsonPath("$.data.reviews", hasSize(1)));
    }
}
