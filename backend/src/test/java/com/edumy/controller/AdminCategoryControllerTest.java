package com.edumy.controller;

import com.edumy.dto.admin.CategoryRequest;
import com.edumy.entity.Category;
import com.edumy.entity.Course;
import com.edumy.entity.CourseLevel;
import com.edumy.entity.CourseStatus;
import com.edumy.repository.CategoryRepository;
import com.edumy.repository.CourseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminCategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Test
    @DisplayName("Acceptance Criteria 1: User không phải admin gọi API nhận 403 Forbidden")
    void testNonAdminReceives403() throws Exception {
        // Gọi không có role admin (anonymous)
        mockMvc.perform(get("/api/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        // Gọi với role STUDENT
        mockMvc.perform(get("/api/admin/categories")
                        .header("X-User-Role", "STUDENT")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Admin lấy danh sách categories thành công (200 OK)")
    void testAdminGetCategories() throws Exception {
        mockMvc.perform(get("/api/admin/categories")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("Admin tạo category mới thành công (201 CREATED)")
    void testAdminCreateCategory() throws Exception {
        String uniqueSlug = "test-cat-" + System.currentTimeMillis();
        CategoryRequest req = CategoryRequest.builder()
                .name("Test Category " + System.currentTimeMillis())
                .slug(uniqueSlug)
                .icon("school")
                .description("Mô tả test")
                .build();

        mockMvc.perform(post("/api/admin/categories")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.slug").value(uniqueSlug));
    }

    @Test
    @DisplayName("Acceptance Criteria 2: Xóa category đang có khóa học trả về 409 CONFLICT")
    void testDeleteCategoryWithCoursesReturns409() throws Exception {
        // Tạo category và khóa học liên kết
        Category cat = categoryRepository.save(Category.builder()
                .name("Cat Has Course " + System.currentTimeMillis())
                .slug("cat-has-course-" + System.currentTimeMillis())
                .build());

        courseRepository.save(Course.builder()
                .instructorId(1L)
                .categoryId(cat.getId())
                .title("Course for Conflict Test")
                .price(BigDecimal.valueOf(100000))
                .level(CourseLevel.BEGINNER)
                .status(CourseStatus.PUBLISHED)
                .build());

        // Cố gắng xóa category đang có khóa học -> Bắt buộc trả về 409
        mockMvc.perform(delete("/api/admin/categories/" + cat.getId())
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Admin xóa category trống (không có khóa học) thành công (200 OK)")
    void testDeleteEmptyCategorySuccess() throws Exception {
        Category cat = categoryRepository.save(Category.builder()
                .name("Empty Cat " + System.currentTimeMillis())
                .slug("empty-cat-" + System.currentTimeMillis())
                .build());

        mockMvc.perform(delete("/api/admin/categories/" + cat.getId())
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
