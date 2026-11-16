package com.edumy.controller;

import com.edumy.entity.*;
import com.edumy.repository.*;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class LearningControllerTest {

    // Context H2 dùng chung giữa các test class: mỗi test dùng userId riêng để không đụng dữ liệu.
    private static final AtomicLong NEXT_USER = new AtomicLong(900_000);

    @Autowired private MockMvc mockMvc;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    private Long userId;
    private Long paidCourseId;
    private Long freeCourseId;
    private Long draftCourseId;

    @BeforeEach
    void setUp() {
        userId = NEXT_USER.incrementAndGet();
        User instructor = userRepository.findByEmail("learning.instructor@edumy.vn").orElseGet(() ->
                userRepository.save(User.builder().email("learning.instructor@edumy.vn")
                        .passwordHash("$2a$10$hashedpassword").fullName("Giảng viên Learning")
                        .role(Role.INSTRUCTOR).status(UserStatus.ACTIVE).build()));

        paidCourseId = course(instructor.getId(), "Khóa có phí", new BigDecimal("99000.00"), CourseStatus.PUBLISHED, 2);
        freeCourseId = course(instructor.getId(), "Khóa miễn phí", BigDecimal.ZERO, CourseStatus.PUBLISHED, 1);
        draftCourseId = course(instructor.getId(), "Khóa nháp", new BigDecimal("50000.00"), CourseStatus.DRAFT, 0);
    }

    private Long course(Long instructorId, String title, BigDecimal price, CourseStatus status, int lessons) {
        Course course = courseRepository.save(Course.builder().instructorId(instructorId).categoryId(1L)
                .title(title).price(price).status(status).build());
        if (lessons > 0) {
            Section section = sectionRepository.save(Section.builder().courseId(course.getId()).title("Chương 1").build());
            for (int i = 1; i <= lessons; i++) {
                lessonRepository.save(Lesson.builder().sectionId(section.getId()).title("Bài " + i).orderIndex(i).build());
            }
        }
        return course.getId();
    }

    private RequestPostProcessor student() {
        return authentication(new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    private String body(Long courseId) {
        return "{\"courseId\":" + courseId + ",\"paymentMethod\":\"MOCK\"}";
    }

    @Test
    @DisplayName("Chưa đăng nhập gọi checkout và my-courses nhận 401")
    void requiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/orders/checkout").contentType(MediaType.APPLICATION_JSON).content(body(paidCourseId)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
        mockMvc.perform(get("/api/v1/learning/my-courses"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Checkout khóa có phí: Order PENDING -> PAID và tạo Enrollment")
    void checkoutPaidCourse() throws Exception {
        mockMvc.perform(post("/api/v1/orders/checkout").with(student())
                        .contentType(MediaType.APPLICATION_JSON).content(body(paidCourseId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PAID"))
                .andExpect(jsonPath("$.data.paymentMethod").value("MOCK"))
                .andExpect(jsonPath("$.data.amount").value(99000.0))
                .andExpect(jsonPath("$.data.txnRef", matchesPattern("EDU\\d{20}")))
                .andExpect(jsonPath("$.data.paidAt").isNotEmpty())
                .andExpect(jsonPath("$.data.enrollmentId").isNumber());

        Order order = orderRepository.findByUserIdOrderByCreatedAtDesc(userId).get(0);
        assertEquals(OrderStatus.PAID, order.getStatus());
        assertNotNull(order.getPaidAt());
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, paidCourseId).orElseThrow();
        assertEquals(order.getId(), enrollment.getOrderId());
    }

    @Test
    @DisplayName("Checkout khóa 0đ: ghi danh trực tiếp, không tạo Order")
    void checkoutFreeCourse() throws Exception {
        mockMvc.perform(post("/api/v1/orders/checkout").with(student())
                        .contentType(MediaType.APPLICATION_JSON).content(body(freeCourseId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("FREE"))
                .andExpect(jsonPath("$.data.orderId").doesNotExist())
                .andExpect(jsonPath("$.data.enrollmentId").isNumber());

        assertTrue(orderRepository.findByUserIdOrderByCreatedAtDesc(userId).isEmpty());
        assertNull(enrollmentRepository.findByUserIdAndCourseId(userId, freeCourseId).orElseThrow().getOrderId());
    }

    @Test
    @DisplayName("Sau checkout, khóa học xuất hiện ngay trong my-courses kèm tiến độ")
    void purchasedCourseAppearsInMyCourses() throws Exception {
        mockMvc.perform(get("/api/v1/learning/my-courses").with(student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        mockMvc.perform(post("/api/v1/orders/checkout").with(student())
                .contentType(MediaType.APPLICATION_JSON).content(body(paidCourseId))).andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/learning/my-courses").with(student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].courseId").value(paidCourseId))
                .andExpect(jsonPath("$.data[0].courseTitle").value("Khóa có phí"))
                .andExpect(jsonPath("$.data[0].instructorName").value("Giảng viên Learning"))
                .andExpect(jsonPath("$.data[0].progressPercent").value(0))
                .andExpect(jsonPath("$.data[0].totalLessons").value(2))
                .andExpect(jsonPath("$.data[0].completedLessons").value(0));
    }

    @Test
    @DisplayName("Không thể mua lại khóa học đã sở hữu (409)")
    void duplicatePurchaseRejected() throws Exception {
        mockMvc.perform(post("/api/v1/orders/checkout").with(student())
                .contentType(MediaType.APPLICATION_JSON).content(body(paidCourseId))).andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/orders/checkout").with(student())
                        .contentType(MediaType.APPLICATION_JSON).content(body(paidCourseId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Bạn đã sở hữu khóa học này"));

        assertEquals(1, orderRepository.findByUserIdOrderByCreatedAtDesc(userId).size());
    }

    @Test
    @DisplayName("Khóa không tồn tại hoặc chưa xuất bản trả 404")
    void unknownOrDraftCourseNotFound() throws Exception {
        mockMvc.perform(post("/api/v1/orders/checkout").with(student())
                        .contentType(MediaType.APPLICATION_JSON).content(body(draftCourseId)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
        mockMvc.perform(post("/api/v1/orders/checkout").with(student())
                        .contentType(MediaType.APPLICATION_JSON).content(body(987_654L)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Thiếu courseId hoặc phương thức khác MOCK trả 400 đúng format lỗi")
    void validation() throws Exception {
        mockMvc.perform(post("/api/v1/orders/checkout").with(student())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors[*].field", hasItem("courseId")));
        mockMvc.perform(post("/api/v1/orders/checkout").with(student())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"courseId\":" + paidCourseId + ",\"paymentMethod\":\"VNPAY\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("paymentMethod")));
    }

    @Test
    @DisplayName("Checkout và my-courses có trên Swagger")
    void documentedOnSwagger() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/orders/checkout'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/learning/my-courses'].get").exists());
    }
}
