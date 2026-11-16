package com.edumy.controller;

import com.edumy.dto.course.CourseDetailResponse;
import com.edumy.dto.course.LessonSummaryResponse;
import com.edumy.dto.course.SectionDetailResponse;
import com.edumy.service.CoursePublicService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CoursePublicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CoursePublicService coursePublicService;

    @Test
    @DisplayName("Acceptance Criteria 1: GET /api/courses trả dữ liệu có phân trang và format chuẩn")
    void testGetPublishedCoursesApi() throws Exception {
        mockMvc.perform(get("/api/courses?page=0&size=10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(10));
    }

    @Test
    @DisplayName("Issue #41: GET /api/courses hỗ trợ tìm kiếm theo từ khóa keyword và lọc đa tiêu chí")
    void testSearchAndFilterCourses() throws Exception {
        mockMvc.perform(get("/api/courses?keyword=React&categoryId=1&isFree=false&level=ALL_LEVELS&sort=price_asc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("Issue #41: GET /api/courses lọc khóa học miễn phí isFree=true")
    void testFilterFreeCourses() throws Exception {
        mockMvc.perform(get("/api/courses?isFree=true&sort=newest")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("Acceptance Criteria 2: Bài học không phải preview TUYỆT ĐỐI không lộ videoUrl")
    void testLockedLessonsDoNotExposeVideoUrl() {
        CourseDetailResponse detail = coursePublicService.getCourseDetail(1L);
        assertNotNull(detail, "Khóa học chi tiết không được null");
        assertNotNull(detail.getCurriculum(), "Giáo trình không được null");

        for (SectionDetailResponse section : detail.getCurriculum()) {
            for (LessonSummaryResponse lesson : section.getLessons()) {
                if (Boolean.FALSE.equals(lesson.getIsPreview())) {
                    assertNull(lesson.getVideoUrl(),
                            "Bài học bị khóa (isPreview=false) bắt buộc videoUrl phải là null!");
                } else {
                    assertNotNull(lesson.getVideoUrl(),
                            "Bài học preview (isPreview=true) phải có videoUrl!");
                }
            }
        }
    }
}
