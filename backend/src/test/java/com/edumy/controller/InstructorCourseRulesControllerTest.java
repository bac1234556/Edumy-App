package com.edumy.controller;

import com.edumy.entity.Category;
import com.edumy.entity.Course;
import com.edumy.entity.CourseStatus;
import com.edumy.entity.Enrollment;
import com.edumy.entity.Lesson;
import com.edumy.entity.Section;
import com.edumy.repository.CategoryRepository;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.EnrollmentRepository;
import com.edumy.repository.LessonRepository;
import com.edumy.repository.SectionRepository;
import org.junit.jupiter.api.Assertions;
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

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InstructorCourseRulesControllerTest {

    private static final Long INSTRUCTOR_ID = 9001L;
    private static final Long OTHER_INSTRUCTOR_ID = 9002L;
    private static final Long STUDENT_ID = 9003L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    private static RequestPostProcessor instructor(Long id) {
        return authentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))));
    }

    @Test
    @DisplayName("Xóa khóa học đã có học viên trả 409 kèm thông báo dễ hiểu và không xóa dữ liệu")
    void deleteCourseWithEnrollmentReturnsConflict() throws Exception {
        Course course = createCourse(CourseStatus.PUBLISHED, null);
        enrollmentRepository.save(Enrollment.builder()
                .userId(STUDENT_ID)
                .courseId(course.getId())
                .build());

        mockMvc.perform(delete("/api/instructor/courses/{id}", course.getId()).with(instructor(INSTRUCTOR_ID)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("học viên")));

        Assertions.assertTrue(courseRepository.findById(course.getId()).isPresent());
        Assertions.assertTrue(enrollmentRepository.existsByCourseId(course.getId()));
    }

    @Test
    @DisplayName("Xóa khóa học chưa có học viên vẫn thành công")
    void deleteCourseWithoutEnrollmentSucceeds() throws Exception {
        Course course = createCourse(CourseStatus.DRAFT, null);

        mockMvc.perform(delete("/api/instructor/courses/{id}", course.getId()).with(instructor(INSTRUCTOR_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Assertions.assertTrue(courseRepository.findById(course.getId()).isEmpty());
    }

    @Test
    @DisplayName("Giảng viên khác không được xóa hoặc sửa khóa học (403)")
    void otherInstructorCannotDeleteOrUpdate() throws Exception {
        Course course = createCourse(CourseStatus.PUBLISHED, null);

        mockMvc.perform(delete("/api/instructor/courses/{id}", course.getId()).with(instructor(OTHER_INSTRUCTOR_ID)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(put("/api/instructor/courses/{id}", course.getId())
                        .with(instructor(OTHER_INSTRUCTOR_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Đổi tiêu đề trái phép\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Sửa khóa PUBLISHED giữ nguyên status dù client có gửi status khác")
    void updatePublishedCourseKeepsStatus() throws Exception {
        Course course = createCourse(CourseStatus.PUBLISHED, null);

        mockMvc.perform(put("/api/instructor/courses/{id}", course.getId())
                        .with(instructor(INSTRUCTOR_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Tiêu đề mới\",\"status\":\"DRAFT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Tiêu đề mới"))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));

        Course saved = courseRepository.findById(course.getId()).orElseThrow();
        Assertions.assertEquals(CourseStatus.PUBLISHED, saved.getStatus());
        Assertions.assertEquals("Tiêu đề mới", saved.getTitle());
    }

    @Test
    @DisplayName("Sửa khóa REJECTED vẫn giữ REJECTED và lý do cho đến khi gửi duyệt lại")
    void updateRejectedCourseKeepsRejectedStatus() throws Exception {
        Course course = createCourse(CourseStatus.REJECTED, "Bổ sung nội dung chương 2");

        mockMvc.perform(put("/api/instructor/courses/{id}", course.getId())
                        .with(instructor(INSTRUCTOR_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Đã bổ sung mô tả\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value("Bổ sung nội dung chương 2"))
                .andExpect(jsonPath("$.data.description").value("Đã bổ sung mô tả"));
    }

    @Test
    @DisplayName("Gửi duyệt lại khóa REJECTED chuyển PENDING và xóa lý do từ chối")
    void resubmitRejectedCourseMovesToPending() throws Exception {
        Course course = createCourse(CourseStatus.REJECTED, "Bổ sung nội dung chương 2");
        addVideoLesson(course);

        mockMvc.perform(post("/api/instructor/courses/{id}/submit-review", course.getId())
                        .with(instructor(INSTRUCTOR_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.rejectionReason").isEmpty());

        Course saved = courseRepository.findById(course.getId()).orElseThrow();
        Assertions.assertEquals(CourseStatus.PENDING, saved.getStatus());
        Assertions.assertNull(saved.getRejectionReason());
    }

    @Test
    @DisplayName("Gửi duyệt lại khóa REJECTED nhưng chưa có video trả 400")
    void resubmitRejectedCourseWithoutVideoReturnsBadRequest() throws Exception {
        Course course = createCourse(CourseStatus.REJECTED, "Thiếu video");

        mockMvc.perform(post("/api/instructor/courses/{id}/submit-review", course.getId())
                        .with(instructor(INSTRUCTOR_ID)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        Assertions.assertEquals(CourseStatus.REJECTED,
                courseRepository.findById(course.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("Khóa PUBLISHED hoặc PENDING không thể gửi duyệt (400)")
    void submitPublishedOrPendingCourseReturnsBadRequest() throws Exception {
        Course published = createCourse(CourseStatus.PUBLISHED, null);
        Course pending = createCourse(CourseStatus.PENDING, null);

        mockMvc.perform(post("/api/instructor/courses/{id}/submit-review", published.getId())
                        .with(instructor(INSTRUCTOR_ID)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/api/instructor/courses/{id}/submit-review", pending.getId())
                        .with(instructor(INSTRUCTOR_ID)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Luồng đầy đủ: bị từ chối -> xem lý do -> sửa -> gửi lại -> được duyệt")
    void rejectedEditResubmitApprovedFlow() throws Exception {
        Course course = createCourse(CourseStatus.PENDING, null);
        addVideoLesson(course);
        String reason = "Bổ sung nội dung cho chương 2";

        // 1. Admin từ chối kèm lý do
        mockMvc.perform(patch("/api/v1/admin/courses/{id}/reject", course.getId())
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rejectionReason\":\"" + reason + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));

        // 2. Giảng viên thấy trạng thái REJECTED và lý do để hiển thị banner
        mockMvc.perform(get("/api/instructor/courses/{id}", course.getId()).with(instructor(INSTRUCTOR_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value(reason));

        // 3. Giảng viên sửa nội dung, status vẫn REJECTED
        mockMvc.perform(put("/api/instructor/courses/{id}", course.getId())
                        .with(instructor(INSTRUCTOR_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Mô tả đã bổ sung theo góp ý\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));

        // 4. Gửi duyệt lại -> PENDING
        mockMvc.perform(post("/api/instructor/courses/{id}/submit-review", course.getId())
                        .with(instructor(INSTRUCTOR_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        // 5. Admin duyệt -> PUBLISHED, không còn lý do từ chối
        mockMvc.perform(patch("/api/v1/admin/courses/{id}/approve", course.getId())
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));

        Course saved = courseRepository.findById(course.getId()).orElseThrow();
        Assertions.assertEquals(CourseStatus.PUBLISHED, saved.getStatus());
        Assertions.assertNull(saved.getRejectionReason());
        Assertions.assertEquals("Mô tả đã bổ sung theo góp ý", saved.getDescription());
    }

    private Course createCourse(CourseStatus courseStatus, String rejectionReason) {
        long suffix = System.nanoTime();
        Category category = categoryRepository.save(Category.builder()
                .name("Category " + suffix)
                .slug("category-" + suffix)
                .build());
        return courseRepository.save(Course.builder()
                .instructorId(INSTRUCTOR_ID)
                .categoryId(category.getId())
                .title("Course " + suffix)
                .price(BigDecimal.ZERO)
                .status(courseStatus)
                .rejectionReason(rejectionReason)
                .totalDurationSeconds(3600)
                .build());
    }

    private void addVideoLesson(Course course) {
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
    }
}
