package com.edumy.controller;

import com.edumy.dto.instructor.LessonRequest;
import com.edumy.dto.instructor.SectionRequest;
import com.edumy.entity.Course;
import com.edumy.entity.CourseLevel;
import com.edumy.entity.CourseStatus;
import com.edumy.repository.CourseRepository;
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

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class InstructorSectionLessonControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ObjectMapper mapper;

    private Long testCourseId;

    private static RequestPostProcessor instructor(Long id) {
        return authentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_INSTRUCTOR"))));
    }

    private static RequestPostProcessor student(Long id) {
        return authentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    @BeforeEach
    void setUp() {
        Course course = courseRepository.save(Course.builder()
                .instructorId(1L)
                .categoryId(1L)
                .title("Khóa học test Instructor Studio")
                .price(BigDecimal.valueOf(100000L))
                .level(CourseLevel.ALL_LEVELS)
                .status(CourseStatus.DRAFT)
                .build());
        testCourseId = course.getId();
    }

    @Test
    @DisplayName("Tạo section, bài học, và submit review cho khóa học")
    void testSectionLessonAndSubmitReviewWorkflow() throws Exception {
        // 1. Tạo Section
        SectionRequest sectionReq = SectionRequest.builder()
                .title("Chương 1: Bắt đầu")
                .build();

        String sectionResp = mockMvc.perform(post("/api/v1/instructor/courses/" + testCourseId + "/sections")
                        .with(instructor(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(sectionReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Chương 1: Bắt đầu"))
                .andReturn().getResponse().getContentAsString();

        Long sectionId = mapper.readTree(sectionResp).get("data").get("id").asLong();

        // 2. Tạo Lesson có videoUrl
        LessonRequest lessonReq = LessonRequest.builder()
                .title("Bài 1: Giới thiệu")
                .videoUrl("https://res.cloudinary.com/edumy/video/upload/sample.mp4")
                .publicId("sample_vid")
                .durationSec(120)
                .isPreview(true)
                .build();

        mockMvc.perform(post("/api/v1/instructor/sections/" + sectionId + "/lessons")
                        .with(instructor(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(lessonReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Bài 1: Giới thiệu"));

        // 3. Submit review thành công
        mockMvc.perform(post("/api/v1/instructor/courses/" + testCourseId + "/submit-review")
                        .with(instructor(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("Submit review thất bại nếu khóa học chưa có section hoặc video")
    void testSubmitReviewFailsWithoutVideo() throws Exception {
        Course emptyCourse = courseRepository.save(Course.builder()
                .instructorId(1L)
                .categoryId(1L)
                .title("Khóa học rỗng")
                .price(BigDecimal.ZERO)
                .status(CourseStatus.DRAFT)
                .build());

        mockMvc.perform(post("/api/v1/instructor/courses/" + emptyCourse.getId() + "/submit-review")
                        .with(instructor(1L)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
