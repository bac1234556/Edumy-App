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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class LearningProgressControllerTest {

    private static final AtomicLong NEXT_USER = new AtomicLong(700_000);

    @Autowired private MockMvc mockMvc;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private LessonProgressRepository lessonProgressRepository;

    private Long userId;
    private Long courseId;
    private Long lessonA;   // video 100 giây
    private Long lessonB;   // video 200 giây
    private Long textLesson; // không có video, duration 0

    @BeforeEach
    void setUp() {
        userId = NEXT_USER.incrementAndGet();
        courseId = courseRepository.save(Course.builder().instructorId(1L).categoryId(1L).title("Khóa tiến độ")
                .price(new BigDecimal("99000.00")).status(CourseStatus.PUBLISHED).build()).getId();
        Long sectionId = sectionRepository.save(Section.builder().courseId(courseId).title("Chương 1").build()).getId();
        lessonA = lesson(sectionId, "Bài A", 100, 1);
        lessonB = lesson(sectionId, "Bài B", 200, 2);
        textLesson = lesson(sectionId, "Bài đọc", 0, 3);
    }

    private Long lesson(Long sectionId, String title, int duration, int order) {
        return lessonRepository.save(Lesson.builder().sectionId(sectionId).title(title)
                .videoUrl(duration > 0 ? "https://cdn/v.mp4" : null).durationSeconds(duration).orderIndex(order).build()).getId();
    }

    private void enroll() {
        enrollmentRepository.save(Enrollment.builder().userId(userId).courseId(courseId).build());
    }

    private RequestPostProcessor student() {
        return authentication(new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    private String progressUrl(Long lessonId) {
        return "/api/learn/lessons/" + lessonId + "/progress";
    }

    private String resumeUrl() {
        return "/api/learn/courses/" + courseId + "/resume";
    }

    private org.springframework.test.web.servlet.ResultActions save(Long lessonId, String json) throws Exception {
        return mockMvc.perform(put(progressUrl(lessonId)).with(student())
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    @DisplayName("Chưa đăng nhập nhận 401")
    void requiresAuthentication() throws Exception {
        mockMvc.perform(put(progressUrl(lessonA)).contentType(MediaType.APPLICATION_JSON).content("{\"positionSec\":5}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get(resumeUrl())).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Chưa mua khóa học: lưu tiến độ và resume đều bị chặn 403")
    void notEnrolledForbidden() throws Exception {
        save(lessonA, "{\"positionSec\":5}")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
        mockMvc.perform(get(resumeUrl()).with(student())).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Bài hoặc khóa không tồn tại trả 404")
    void notFound() throws Exception {
        enroll();
        save(987_654L, "{\"positionSec\":5}").andExpect(status().isNotFound());
        mockMvc.perform(get("/api/learn/courses/987654/resume").with(student())).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Xem dưới 90% chỉ lưu vị trí, chưa hoàn thành")
    void belowThresholdOnlySavesPosition() throws Exception {
        enroll();
        save(lessonA, "{\"positionSec\":89,\"completed\":false}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.positionSec").value(89))
                .andExpect(jsonPath("$.data.completed").value(false))
                .andExpect(jsonPath("$.data.progressPercent").value(0))
                .andExpect(jsonPath("$.data.totalLessons").value(3));
    }

    @Test
    @DisplayName("Xem đủ 90% thì bài tự hoàn thành và tính lại progress_percent")
    void ninetyPercentCompletesAutomatically() throws Exception {
        enroll();
        save(lessonA, "{\"positionSec\":90}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed").value(true))
                .andExpect(jsonPath("$.data.completedLessons").value(1))
                .andExpect(jsonPath("$.data.progressPercent").value(33))
                .andExpect(jsonPath("$.data.courseCompleted").value(false));

        assertEquals(33, enrollmentRepository.findByUserIdAndCourseId(userId, courseId).orElseThrow().getProgressPercent());
    }

    @Test
    @DisplayName("Hoàn thành hết các bài: 100% và ghi completed_at của enrollment")
    void completingAllLessonsReaches100() throws Exception {
        enroll();
        save(lessonA, "{\"positionSec\":100}").andExpect(status().isOk());
        save(lessonB, "{\"positionSec\":180}").andExpect(status().isOk());
        save(textLesson, "{\"positionSec\":0,\"completed\":true}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progressPercent").value(100))
                .andExpect(jsonPath("$.data.courseCompleted").value(true));

        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId).orElseThrow();
        assertEquals(100, enrollment.getProgressPercent());
        assertNotNull(enrollment.getCompletedAt());
    }

    @Test
    @DisplayName("Bài TEXT (không có thời lượng) chỉ hoàn thành khi client gửi completed=true")
    void textLessonNeedsExplicitCompletion() throws Exception {
        enroll();
        save(textLesson, "{\"positionSec\":9999}")
                .andExpect(jsonPath("$.data.completed").value(false))
                .andExpect(jsonPath("$.data.positionSec").value(9999));
        save(textLesson, "{\"positionSec\":0,\"completed\":true}")
                .andExpect(jsonPath("$.data.completed").value(true));
    }

    @Test
    @DisplayName("Đã hoàn thành thì không bị bỏ hoàn thành khi xem lại từ đầu")
    void completedStaysCompleted() throws Exception {
        enroll();
        save(lessonA, "{\"positionSec\":95}").andExpect(jsonPath("$.data.completed").value(true));
        save(lessonA, "{\"positionSec\":3,\"completed\":false}")
                .andExpect(jsonPath("$.data.completed").value(true))
                .andExpect(jsonPath("$.data.positionSec").value(3));
        assertEquals(1, lessonProgressRepository.findByEnrollmentId(
                enrollmentRepository.findByUserIdAndCourseId(userId, courseId).orElseThrow().getId()).size());
    }

    @Test
    @DisplayName("Vị trí vượt thời lượng được cắt về thời lượng")
    void positionIsClampedToDuration() throws Exception {
        enroll();
        save(lessonA, "{\"positionSec\":5000}")
                .andExpect(jsonPath("$.data.positionSec").value(100))
                .andExpect(jsonPath("$.data.completed").value(true));
    }

    @Test
    @DisplayName("Thiếu hoặc âm positionSec trả 400 đúng format lỗi")
    void validation() throws Exception {
        enroll();
        save(lessonA, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors[*].field", hasItem("positionSec")));
        save(lessonA, "{\"positionSec\":-1}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("positionSec")));
    }

    @Test
    @DisplayName("Resume khi chưa học bài nào trả bài đầu tiên ở giây 0")
    void resumeWithoutProgressReturnsFirstLesson() throws Exception {
        enroll();
        mockMvc.perform(get(resumeUrl()).with(student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lessonId").value(lessonA))
                .andExpect(jsonPath("$.data.positionSec").value(0))
                .andExpect(jsonPath("$.data.completed").value(false))
                .andExpect(jsonPath("$.data.totalLessons").value(3))
                .andExpect(jsonPath("$.data.completedLessonIds", hasSize(0)));
    }

    @Test
    @DisplayName("Resume trả bài xem gần nhất, đúng giây và danh sách bài đã xong")
    void resumeReturnsLastWatchedLesson() throws Exception {
        enroll();
        save(lessonA, "{\"positionSec\":95}").andExpect(status().isOk());
        save(lessonB, "{\"positionSec\":42}").andExpect(status().isOk());

        mockMvc.perform(get(resumeUrl()).with(student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.courseId").value(courseId))
                .andExpect(jsonPath("$.data.lessonId").value(lessonB))
                .andExpect(jsonPath("$.data.positionSec").value(42))
                .andExpect(jsonPath("$.data.completed").value(false))
                .andExpect(jsonPath("$.data.completedLessonIds", contains(lessonA.intValue())))
                .andExpect(jsonPath("$.data.progressPercent").value(33));
    }

    @Test
    @DisplayName("Hai học viên có tiến độ độc lập")
    void progressIsPerUser() throws Exception {
        enroll();
        save(lessonA, "{\"positionSec\":95}").andExpect(status().isOk());

        Long other = NEXT_USER.incrementAndGet();
        enrollmentRepository.save(Enrollment.builder().userId(other).courseId(courseId).build());
        mockMvc.perform(get(resumeUrl()).with(authentication(new UsernamePasswordAuthenticationToken(
                        other, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))))))
                .andExpect(jsonPath("$.data.lessonId").value(lessonA))
                .andExpect(jsonPath("$.data.positionSec").value(0))
                .andExpect(jsonPath("$.data.completedLessonIds", hasSize(0)));
    }

    @Test
    @DisplayName("Hai endpoint có trên Swagger")
    void documentedOnSwagger() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/learn/lessons/{lessonId}/progress'].put").exists())
                .andExpect(jsonPath("$.paths['/api/learn/courses/{courseId}/resume'].get").exists());
    }
}
