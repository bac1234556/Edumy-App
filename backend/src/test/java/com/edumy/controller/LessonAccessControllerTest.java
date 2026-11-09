package com.edumy.controller;

import com.edumy.entity.*;
import com.edumy.repository.*;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class LessonAccessControllerTest {

    private static final AtomicLong NEXT_USER = new AtomicLong(800_000);
    private static final String VIDEO = "https://res.cloudinary.com/demo/video/upload/dog.mp4";

    @Autowired private MockMvc mockMvc;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    private Long userId;
    private Long courseId;
    private Long previewLessonId;
    private Long lockedLessonId;
    private Long otherCourseLessonId;

    @BeforeEach
    void setUp() {
        userId = NEXT_USER.incrementAndGet();
        courseId = courseRepository.save(Course.builder().instructorId(1L).categoryId(1L).title("Khóa player")
                .price(new BigDecimal("99000.00")).status(CourseStatus.PUBLISHED).build()).getId();
        Long sectionId = sectionRepository.save(Section.builder().courseId(courseId).title("Chương 1").build()).getId();
        previewLessonId = lessonRepository.save(Lesson.builder().sectionId(sectionId).title("Giới thiệu")
                .videoUrl(VIDEO).durationSeconds(60).isPreview(true).orderIndex(1).build()).getId();
        lockedLessonId = lessonRepository.save(Lesson.builder().sectionId(sectionId).title("Bài thực hành")
                .videoUrl(VIDEO).durationSeconds(60).isPreview(false).orderIndex(2).build()).getId();

        Long otherCourse = courseRepository.save(Course.builder().instructorId(1L).categoryId(1L).title("Khóa khác")
                .status(CourseStatus.PUBLISHED).build()).getId();
        Long otherSection = sectionRepository.save(Section.builder().courseId(otherCourse).title("C1").build()).getId();
        otherCourseLessonId = lessonRepository.save(Lesson.builder().sectionId(otherSection).title("Bài khác")
                .videoUrl(VIDEO).build()).getId();
    }

    private RequestPostProcessor student() {
        return authentication(new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    private String url(Long course, Long lesson) {
        return "/api/v1/learning/courses/" + course + "/lessons/" + lesson;
    }

    @Test
    @DisplayName("Chưa đăng nhập nhận 401")
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get(url(courseId, lockedLessonId)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Chưa mua khóa học mà mở bài thường bị chặn 403")
    void notEnrolledLockedLessonForbidden() throws Exception {
        mockMvc.perform(get(url(courseId, lockedLessonId)).with(student()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(jsonPath("$.message").value("Bạn cần mua khóa học để xem bài học này"));
    }

    @Test
    @DisplayName("Bài xem trước mở được khi chưa mua")
    void previewLessonAllowedWithoutEnrollment() throws Exception {
        mockMvc.perform(get(url(courseId, previewLessonId)).with(student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.videoUrl").value(VIDEO))
                .andExpect(jsonPath("$.data.isPreview").value(true));
    }

    @Test
    @DisplayName("Đã ghi danh thì lấy được videoUrl của bài thường")
    void enrolledStudentGetsVideo() throws Exception {
        enrollmentRepository.save(Enrollment.builder().userId(userId).courseId(courseId).build());
        mockMvc.perform(get(url(courseId, lockedLessonId)).with(student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(lockedLessonId))
                .andExpect(jsonPath("$.data.courseId").value(courseId))
                .andExpect(jsonPath("$.data.title").value("Bài thực hành"))
                .andExpect(jsonPath("$.data.videoUrl").value(VIDEO))
                .andExpect(jsonPath("$.data.durationSeconds").value(60));
    }

    @Test
    @DisplayName("Bài không thuộc khóa, bài hoặc khóa không tồn tại trả 404")
    void mismatchedOrMissingReturnsNotFound() throws Exception {
        enrollmentRepository.save(Enrollment.builder().userId(userId).courseId(courseId).build());
        mockMvc.perform(get(url(courseId, otherCourseLessonId)).with(student()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
        mockMvc.perform(get(url(courseId, 987_654L)).with(student()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get(url(987_654L, lockedLessonId)).with(student()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Endpoint có trên Swagger")
    void documentedOnSwagger() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/learning/courses/{courseId}/lessons/{lessonId}'].get").exists());
    }
}
