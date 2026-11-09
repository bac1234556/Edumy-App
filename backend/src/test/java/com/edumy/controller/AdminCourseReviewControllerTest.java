package com.edumy.controller;

import com.edumy.entity.*;
import com.edumy.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
@Transactional
class AdminCourseReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    void pendingListReturnsOnlyCoursesWaitingForReview() throws Exception {
        Course pending = createCourse(CourseStatus.PENDING);
        createCourse(CourseStatus.DRAFT);

        mockMvc.perform(get("/api/v1/admin/courses/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[*].id", hasItem(pending.getId().intValue())))
                .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
    }

    @Test
    void courseDetailIncludesFullCurriculumAndVideoUrls() throws Exception {
        Course course = createCourse(CourseStatus.PENDING);
        Section section = sectionRepository.save(Section.builder()
                .courseId(course.getId())
                .title("Section 1")
                .orderIndex(1)
                .build());
        lessonRepository.save(Lesson.builder()
                .sectionId(section.getId())
                .title("Lesson 1")
                .videoUrl("https://cdn.example.com/lesson.mp4")
                .durationSeconds(120)
                .isPreview(false)
                .orderIndex(1)
                .build());

        mockMvc.perform(get("/api/v1/admin/courses/{id}", course.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.curriculum[0].lessons[0].videoUrl")
                        .value("https://cdn.example.com/lesson.mp4"));
    }

    @Test
    void courseDetailNotFoundReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/admin/courses/{id}", 999999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void approvePublishesCourseAndNotifiesInstructor() throws Exception {
        Course course = createCourse(CourseStatus.PENDING);

        mockMvc.perform(patch("/api/v1/admin/courses/{id}/approve", course.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));

        org.junit.jupiter.api.Assertions.assertEquals(CourseStatus.PUBLISHED,
                courseRepository.findById(course.getId()).orElseThrow().getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(1,
                notificationRepository.findByUserIdOrderByCreatedAtDesc(course.getInstructorId(),
                        org.springframework.data.domain.PageRequest.of(0, 10)).getTotalElements());
    }

    @Test
    void approveNonPendingCourseReturnsConflict() throws Exception {
        Course draftCourse = createCourse(CourseStatus.DRAFT);

        mockMvc.perform(patch("/api/v1/admin/courses/{id}/approve", draftCourse.getId()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void approveCourseNotFoundReturns404() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/courses/{id}/approve", 999999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void rejectRequiresReasonAndIncludesItInInstructorNotification() throws Exception {
        Course course = createCourse(CourseStatus.PENDING);
        String reason = "Bổ sung nội dung cho chương 2";

        mockMvc.perform(patch("/api/v1/admin/courses/{id}/reject", course.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("rejectionReason", reason))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value(reason));

        Notification notification = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(course.getInstructorId(),
                        org.springframework.data.domain.PageRequest.of(0, 10))
                .getContent().get(0);
        org.junit.jupiter.api.Assertions.assertEquals(NotificationType.COURSE_REJECTED, notification.getType());
        org.junit.jupiter.api.Assertions.assertTrue(notification.getBody().contains(reason));
    }

    @Test
    void rejectNonPendingCourseReturnsConflict() throws Exception {
        Course publishedCourse = createCourse(CourseStatus.PUBLISHED);

        mockMvc.perform(patch("/api/v1/admin/courses/{id}/reject", publishedCourse.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("rejectionReason", "Lý do"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void rejectCourseNotFoundReturns404() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/courses/{id}/reject", 999999L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("rejectionReason", "Lý do"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void rejectWithoutReasonReturnsValidationError() throws Exception {
        Course course = createCourse(CourseStatus.PENDING);

        mockMvc.perform(patch("/api/v1/admin/courses/{id}/reject", course.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rejectionReason\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void invalidPaginationReturnsValidationError() throws Exception {
        mockMvc.perform(get("/api/v1/admin/courses/pending?page=-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void nonAdminCannotReviewCourses() throws Exception {
        mockMvc.perform(get("/api/v1/admin/courses/pending")
                        .with(user("student").roles("STUDENT")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void instructorsCanOnlyReadTheirOwnNotifications() throws Exception {
        Course course = createCourse(CourseStatus.PENDING);
        notificationRepository.save(Notification.builder()
                .userId(course.getInstructorId())
                .type(NotificationType.COURSE_REJECTED)
                .title("Khóa học cần chỉnh sửa")
                .body("Lý do: Bổ sung nội dung")
                .build());
        notificationRepository.save(Notification.builder()
                .userId(course.getInstructorId() + 1000)
                .type(NotificationType.COURSE_REJECTED)
                .title("Thông báo riêng")
                .body("Không được trả về cho người khác")
                .build());
        var instructorAuthentication = new UsernamePasswordAuthenticationToken(
                course.getInstructorId(),
                null,
                java.util.List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR")));

        mockMvc.perform(get("/api/v1/notifications")
                        .with(authentication(instructorAuthentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].body").value("Lý do: Bổ sung nội dung"));
    }

    @Test
    void notificationUnreadCountAndMarkAsReadAndMarkAllAsRead() throws Exception {
        Course course = createCourse(CourseStatus.PENDING);
        Notification notif1 = notificationRepository.save(Notification.builder()
                .userId(course.getInstructorId())
                .type(NotificationType.COURSE_APPROVED)
                .title("Khóa học đã duyệt 1")
                .body("Chúc mừng 1")
                .isRead(false)
                .build());
        Notification notif2 = notificationRepository.save(Notification.builder()
                .userId(course.getInstructorId())
                .type(NotificationType.COURSE_APPROVED)
                .title("Khóa học đã duyệt 2")
                .body("Chúc mừng 2")
                .isRead(false)
                .build());
        var instructorAuthentication = new UsernamePasswordAuthenticationToken(
                course.getInstructorId(),
                null,
                java.util.List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR")));

        // 1. Kiểm tra số lượng unread = 2
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .with(authentication(instructorAuthentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(2));

        // 2. Đánh dấu 1 thông báo đã đọc
        mockMvc.perform(patch("/api/v1/notifications/{id}/read", notif1.getId())
                        .with(authentication(instructorAuthentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRead").value(true));

        // 3. Kiểm tra unread giảm còn 1
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .with(authentication(instructorAuthentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(1));

        // 4. Đánh dấu tất cả đã đọc
        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .with(authentication(instructorAuthentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.updatedCount").value(1));

        // 5. Kiểm tra unread = 0
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .with(authentication(instructorAuthentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));
    }

    private Course createCourse(CourseStatus status) {
        long suffix = System.nanoTime();
        User instructor = userRepository.save(User.builder()
                .email("instructor-" + suffix + "@example.test")
                .passwordHash("not-used")
                .fullName("Test Instructor")
                .role(Role.INSTRUCTOR)
                .build());
        Category category = categoryRepository.save(Category.builder()
                .name("Category " + suffix)
                .slug("category-" + suffix)
                .build());
        return courseRepository.save(Course.builder()
                .instructorId(instructor.getId())
                .categoryId(category.getId())
                .title("Course " + suffix)
                .price(BigDecimal.ZERO)
                .status(status)
                .totalDurationSeconds(3600)
                .build());
    }
}
