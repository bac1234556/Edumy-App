package com.edumy.controller;

import com.edumy.dto.instructor.CourseResponse;
import com.edumy.entity.CourseStatus;
import com.edumy.service.CloudinarySignService;
import com.edumy.service.InstructorCourseService;
import com.edumy.service.InstructorLessonService;
import com.edumy.service.InstructorSectionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {InstructorCourseController.class, MediaSignatureController.class})
class InstructorCourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InstructorCourseService instructorCourseService;

    @MockBean
    private InstructorSectionService instructorSectionService;

    @MockBean
    private InstructorLessonService instructorLessonService;

    @MockBean
    private CloudinarySignService cloudinarySignService;

    @Test
    @WithMockUser(username = "instructor@edumy.com", roles = {"INSTRUCTOR"})
    void getMyCoursesSuccess() throws Exception {
        CourseResponse mockCourse = CourseResponse.builder()
                .id(1L)
                .title("Spring Boot Masterclass")
                .price(BigDecimal.valueOf(100000))
                .status(CourseStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(instructorCourseService.getMyCourses(anyLong()))
                .thenReturn(Collections.singletonList(mockCourse));

        mockMvc.perform(get("/api/v1/instructor/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Spring Boot Masterclass"));
    }

    @Test
    @WithMockUser(username = "instructor@edumy.com", roles = {"INSTRUCTOR"})
    void getCloudinarySignature() throws Exception {
        com.edumy.dto.instructor.CloudinarySignatureResponse mockSig = 
                com.edumy.dto.instructor.CloudinarySignatureResponse.builder()
                .signature("mock_signature_hash")
                .timestamp(1731138000L)
                .apiKey("123456789")
                .cloudName("edumy_cloud")
                .folder("edumy/courses")
                .build();

        when(cloudinarySignService.generateSignature(anyString())).thenReturn(mockSig);

        mockMvc.perform(post("/api/v1/instructor/media/signature")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.signature").value("mock_signature_hash"));
    }
}