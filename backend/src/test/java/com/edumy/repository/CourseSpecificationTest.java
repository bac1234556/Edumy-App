package com.edumy.repository;

import com.edumy.entity.Course;
import com.edumy.entity.CourseLevel;
import com.edumy.entity.CourseStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class CourseSpecificationTest {

    @Autowired
    private CourseRepository courseRepository;

    private Course c1PublishedReact;
    private Course c2PublishedJava;
    private Course c3PublishedFreeFigma;
    private Course c4DraftReact;
    private Course c5RejectedJava;

    @BeforeEach
    void setUp() {
        // C1: React, category 1, price 500k, BEGINNER, PUBLISHED, avgRating 4.9
        c1PublishedReact = courseRepository.save(Course.builder()
                .title("Lập trình React Native thực chiến")
                .subtitle("Xây dựng ứng dụng di động đa nền tảng")
                .categoryId(1L)
                .instructorId(101L)
                .price(new BigDecimal("500000.00"))
                .level(CourseLevel.BEGINNER)
                .status(CourseStatus.PUBLISHED)
                .avgRating(4.9)
                .ratingCount(50)
                .build());

        // C2: Java, category 1, price 300k, ADVANCED, PUBLISHED, avgRating 4.2
        c2PublishedJava = courseRepository.save(Course.builder()
                .title("Chuyên gia Spring Boot & Microservices")
                .subtitle("Kiến trúc hệ thống lớn với Java và Docker")
                .categoryId(1L)
                .instructorId(102L)
                .price(new BigDecimal("300000.00"))
                .level(CourseLevel.ADVANCED)
                .status(CourseStatus.PUBLISHED)
                .avgRating(4.2)
                .ratingCount(20)
                .build());

        // C3: Figma, category 2, price 0đ (Free), ALL_LEVELS, PUBLISHED, avgRating 4.7
        c3PublishedFreeFigma = courseRepository.save(Course.builder()
                .title("Thiết kế UI UX cơ bản")
                .subtitle("Sử dụng Figma từ số không")
                .categoryId(2L)
                .instructorId(103L)
                .price(BigDecimal.ZERO)
                .level(CourseLevel.ALL_LEVELS)
                .status(CourseStatus.PUBLISHED)
                .avgRating(4.7)
                .ratingCount(80)
                .build());

        // C4: React but DRAFT (must be excluded from public specification)
        c4DraftReact = courseRepository.save(Course.builder()
                .title("React Native nâng cao Draft")
                .subtitle("Bản nháp đang soạn thảo")
                .categoryId(1L)
                .instructorId(101L)
                .price(new BigDecimal("200000.00"))
                .level(CourseLevel.ADVANCED)
                .status(CourseStatus.DRAFT)
                .build());

        // C5: Java but REJECTED (must be excluded from public specification)
        c5RejectedJava = courseRepository.save(Course.builder()
                .title("Lập trình Java căn bản Rejected")
                .subtitle("Bị từ chối kiểm duyệt")
                .categoryId(1L)
                .instructorId(102L)
                .price(BigDecimal.ZERO)
                .level(CourseLevel.BEGINNER)
                .status(CourseStatus.REJECTED)
                .build());
    }

    @Test
    @DisplayName("Filter keyword: Tìm thấy theo tiêu đề và không phân biệt hoa thường")
    void testFilterByKeywordTitle() {
        Specification<Course> spec = CourseSpecification.filterCourses("react", null, null, null);
        List<Course> results = courseRepository.findAll(spec);

        assertTrue(results.stream().anyMatch(c -> c.getId().equals(c1PublishedReact.getId())));
        assertFalse(results.stream().anyMatch(c -> c.getId().equals(c4DraftReact.getId())),
                "Khóa học trạng thái DRAFT không bao giờ được xuất hiện");
    }

    @Test
    @DisplayName("Filter keyword: Tìm thấy theo phụ đề (subtitle)")
    void testFilterByKeywordSubtitle() {
        Specification<Course> spec = CourseSpecification.filterCourses("Microservices", null, null, null);
        List<Course> results = courseRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(c2PublishedJava.getId(), results.get(0).getId());
    }

    @Test
    @DisplayName("Filter categoryId: Chỉ trả về khóa học thuộc đúng danh mục")
    void testFilterByCategoryId() {
        Specification<Course> spec = CourseSpecification.filterCourses(null, 2L, null, null);
        List<Course> results = courseRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(c3PublishedFreeFigma.getId(), results.get(0).getId());
    }

    @Test
    @DisplayName("Filter isFree = true: Chỉ trả về khóa học có giá bằng 0đ")
    void testFilterByIsFreeTrue() {
        Specification<Course> spec = CourseSpecification.filterCourses(null, null, true, null);
        List<Course> results = courseRepository.findAll(spec);

        assertTrue(results.stream().allMatch(c -> c.getPrice().compareTo(BigDecimal.ZERO) == 0));
        assertTrue(results.stream().anyMatch(c -> c.getId().equals(c3PublishedFreeFigma.getId())));
        assertFalse(results.stream().anyMatch(c -> c.getId().equals(c5RejectedJava.getId())),
                "Khóa học REJECTED không được xuất hiện dù có giá 0đ");
    }

    @Test
    @DisplayName("Filter isFree = false: Chỉ trả về khóa học có phí (> 0đ)")
    void testFilterByIsFreeFalse() {
        Specification<Course> spec = CourseSpecification.filterCourses(null, null, false, null);
        List<Course> results = courseRepository.findAll(spec);

        assertTrue(results.stream().allMatch(c -> c.getPrice().compareTo(BigDecimal.ZERO) > 0));
        assertTrue(results.stream().anyMatch(c -> c.getId().equals(c1PublishedReact.getId())));
        assertTrue(results.stream().anyMatch(c -> c.getId().equals(c2PublishedJava.getId())));
        assertFalse(results.stream().anyMatch(c -> c.getId().equals(c3PublishedFreeFigma.getId())));
    }

    @Test
    @DisplayName("Filter level: Lọc chính xác theo cấp độ khóa học")
    void testFilterByLevel() {
        Specification<Course> spec = CourseSpecification.filterCourses(null, null, null, CourseLevel.ADVANCED);
        List<Course> results = courseRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(c2PublishedJava.getId(), results.get(0).getId());
    }

    @Test
    @DisplayName("Kết hợp đa tiêu chí: keyword + categoryId + isFree + level")
    void testCombinedFilters() {
        Specification<Course> spec = CourseSpecification.filterCourses(
                "React", 1L, false, CourseLevel.BEGINNER
        );
        List<Course> results = courseRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(c1PublishedReact.getId(), results.get(0).getId());
    }

    @Test
    @DisplayName("Sắp xếp kết hợp phân trang: newest, price_asc, rating")
    void testSortCombinations() {
        // Price ASC: c3 (0đ) -> c2 (300k) -> c1 (500k)
        Specification<Course> specAll = CourseSpecification.filterCourses(null, null, null, null);
        Page<Course> priceAscPage = courseRepository.findAll(specAll,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "price")));
        List<Course> priceAscList = priceAscPage.getContent();
        assertTrue(priceAscList.size() >= 3);
        assertEquals(BigDecimal.ZERO, priceAscList.get(0).getPrice());

        // Price DESC: c1 (500k) -> c2 (300k) -> c3 (0đ)
        Page<Course> priceDescPage = courseRepository.findAll(specAll,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "price")));
        List<Course> priceDescList = priceDescPage.getContent();
        assertEquals(new BigDecimal("500000.00"), priceDescList.get(0).getPrice());

        // Rating DESC: c1 (4.9) -> c3 (4.7) -> c2 (4.2)
        Page<Course> ratingDescPage = courseRepository.findAll(specAll,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "avgRating")));
        List<Course> ratingDescList = ratingDescPage.getContent();
        assertEquals(c1PublishedReact.getId(), ratingDescList.get(0).getId());
    }
}
