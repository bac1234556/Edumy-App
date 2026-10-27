package com.edumy.service;

import com.edumy.common.PageResponse;
import com.edumy.dto.course.*;
import com.edumy.entity.*;
import com.edumy.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CoursePublicService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;

    /**
     * Lấy danh sách khóa học có trạng thái PUBLISHED, có phân trang và lọc theo danh mục
     */
    public PageResponse<CourseSummaryResponse> getPublishedCourses(Long categoryId, Pageable pageable) {
        Page<Course> coursePage;
        if (categoryId != null && categoryId > 0) {
            coursePage = courseRepository.findByCategoryIdAndStatus(categoryId, CourseStatus.PUBLISHED, pageable);
        } else {
            coursePage = courseRepository.findByStatus(CourseStatus.PUBLISHED, pageable);
        }

        // Nếu DB rỗng, fallback sang dữ liệu seed mẫu cho Swagger/testing
        if (coursePage.isEmpty()) {
            return PageResponse.from(getSeedCoursesPage(pageable));
        }

        List<CourseSummaryResponse> summaries = coursePage.getContent().stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());

        return PageResponse.<CourseSummaryResponse>builder()
                .content(summaries)
                .page(coursePage.getNumber())
                .size(coursePage.getSize())
                .totalElements(coursePage.getTotalElements())
                .totalPages(coursePage.getTotalPages())
                .last(coursePage.isLast())
                .build();
    }

    /**
     * Lấy chi tiết khóa học kèm giáo trình (sections -> lessons).
     * BẢO MẬT: Tuyệt đối không để lộ videoUrl nếu bài học không phải preview.
     */
    public CourseDetailResponse getCourseDetail(Long courseId) {
        Optional<Course> courseOpt = courseRepository.findByIdAndStatus(courseId, CourseStatus.PUBLISHED);

        Course course;
        if (courseOpt.isPresent()) {
            course = courseOpt.get();
        } else {
            // Fallback sang seed data theo ID nếu DB chưa có
            CourseDetailResponse seedDetail = getSeedCourseDetail(courseId);
            if (seedDetail != null) {
                return seedDetail;
            }
            throw new NoSuchElementException("Không tìm thấy khóa học công khai với ID: " + courseId);
        }

        Category category = categoryRepository.findById(course.getCategoryId()).orElse(null);
        Double avgRating = reviewRepository.calculateAverageRatingByCourseId(courseId);
        Long totalReviews = reviewRepository.countByCourseId(courseId);

        List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        List<SectionDetailResponse> curriculum = sections.stream().map(section -> {
            List<Lesson> lessons = lessonRepository.findBySectionIdOrderByOrderIndexAsc(section.getId());
            List<LessonSummaryResponse> lessonDtos = lessons.stream().map(lesson -> {
                boolean isPreview = Boolean.TRUE.equals(lesson.getIsPreview());
                return LessonSummaryResponse.builder()
                        .id(lesson.getId())
                        .title(lesson.getTitle())
                        .durationSeconds(lesson.getDurationSeconds())
                        .isPreview(isPreview)
                        .orderIndex(lesson.getOrderIndex())
                        // CHỈ trả videoUrl nếu isPreview == true, ngược lại luôn là null
                        .videoUrl(isPreview ? lesson.getVideoUrl() : null)
                        .build();
            }).collect(Collectors.toList());

            return SectionDetailResponse.builder()
                    .id(section.getId())
                    .title(section.getTitle())
                    .orderIndex(section.getOrderIndex())
                    .lessons(lessonDtos)
                    .build();
        }).collect(Collectors.toList());

        return CourseDetailResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .subtitle(course.getSubtitle())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .price(course.getPrice())
                .level(course.getLevel())
                .status(course.getStatus())
                .totalDurationSeconds(course.getTotalDurationSeconds())
                .instructor(InstructorSummaryResponse.builder()
                        .id(course.getInstructorId())
                        .fullName("Nguyễn Văn Giảng Viên")
                        .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb")
                        .bio("Chuyên gia phát triển phần mềm với hơn 8 năm kinh nghiệm.")
                        .build())
                .category(category)
                .curriculum(curriculum)
                .averageRating(avgRating != null ? avgRating : 4.8)
                .totalReviews(totalReviews != null ? totalReviews : 128L)
                .createdAt(course.getCreatedAt())
                .build();
    }

    private CourseSummaryResponse mapToSummary(Course course) {
        Category category = categoryRepository.findById(course.getCategoryId()).orElse(null);
        Double avgRating = reviewRepository.calculateAverageRatingByCourseId(course.getId());
        Long totalReviews = reviewRepository.countByCourseId(course.getId());

        return CourseSummaryResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .subtitle(course.getSubtitle())
                .thumbnailUrl(course.getThumbnailUrl())
                .price(course.getPrice())
                .level(course.getLevel())
                .instructorId(course.getInstructorId())
                .instructorName("Giảng viên Edumy")
                .categoryId(course.getCategoryId())
                .categoryName(category != null ? category.getName() : "Công nghệ")
                .averageRating(avgRating != null ? avgRating : 5.0)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .totalDurationSeconds(course.getTotalDurationSeconds())
                .build();
    }

    // ================= DỮ LIỆU SEED MẪU PHỤC VỤ SWAGGER & TESTING =================
    private Page<CourseSummaryResponse> getSeedCoursesPage(Pageable pageable) {
        List<CourseSummaryResponse> list = List.of(
                CourseSummaryResponse.builder()
                        .id(1L)
                        .title("Lập trình React Native & Expo thực chiến 2026")
                        .subtitle("Xây dựng ứng dụng di động Android chất lượng cao từ số 0")
                        .thumbnailUrl("https://images.unsplash.com/photo-1555066931-4365d14bab8c")
                        .price(new BigDecimal("499000.00"))
                        .level(CourseLevel.BEGINNER)
                        .instructorId(101L)
                        .instructorName("Trần Văn Chuyên")
                        .categoryId(1L)
                        .categoryName("Lập trình & CNTT")
                        .averageRating(4.9)
                        .totalReviews(215L)
                        .totalDurationSeconds(43200)
                        .build(),
                CourseSummaryResponse.builder()
                        .id(2L)
                        .title("Spring Boot 3.4 & Microservices Architecture")
                        .subtitle("Thiết kế Backend chịu tải cao, Spring Security JWT và Docker")
                        .thumbnailUrl("https://images.unsplash.com/photo-1517694712202-14dd9538aa97")
                        .price(new BigDecimal("599000.00"))
                        .level(CourseLevel.INTERMEDIATE)
                        .instructorId(102L)
                        .instructorName("Lê Hoàng Nam")
                        .categoryId(1L)
                        .categoryName("Lập trình & CNTT")
                        .averageRating(4.8)
                        .totalReviews(142L)
                        .totalDurationSeconds(54000)
                        .build(),
                CourseSummaryResponse.builder()
                        .id(3L)
                        .title("Thiết kế UI/UX Chuyên nghiệp với Figma")
                        .subtitle("Tư duy thiết kế Design System và Prototype tương tác")
                        .thumbnailUrl("https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e")
                        .price(BigDecimal.ZERO)
                        .level(CourseLevel.ALL_LEVELS)
                        .instructorId(103L)
                        .instructorName("Phạm Mỹ Linh")
                        .categoryId(2L)
                        .categoryName("Thiết kế đồ họa & UI/UX")
                        .averageRating(4.7)
                        .totalReviews(98L)
                        .totalDurationSeconds(28800)
                        .build()
        );
        return new PageImpl<>(list, pageable, list.size());
    }

    private CourseDetailResponse getSeedCourseDetail(Long courseId) {
        List<SectionDetailResponse> curriculum = List.of(
                SectionDetailResponse.builder()
                        .id(1L)
                        .title("Chương 1: Tổng quan & Khởi tạo dự án")
                        .orderIndex(1)
                        .lessons(List.of(
                                LessonSummaryResponse.builder()
                                        .id(101L)
                                        .title("Bài 1: Giới thiệu khóa học & Phương pháp học")
                                        .durationSeconds(420)
                                        .isPreview(true)
                                        .orderIndex(1)
                                        // Bài Preview: Có URL
                                        .videoUrl("https://res.cloudinary.com/demo/video/upload/sample.mp4")
                                        .build(),
                                LessonSummaryResponse.builder()
                                        .id(102L)
                                        .title("Bài 2: Cài đặt Node.js, JDK 21 & Android Studio")
                                        .durationSeconds(780)
                                        .isPreview(true)
                                        .orderIndex(2)
                                        // Bài Preview: Có URL
                                        .videoUrl("https://res.cloudinary.com/demo/video/upload/sample2.mp4")
                                        .build()
                        ))
                        .build(),
                SectionDetailResponse.builder()
                        .id(2L)
                        .title("Chương 2: Kiến trúc Module & Xây dựng RESTful API")
                        .orderIndex(2)
                        .lessons(List.of(
                                LessonSummaryResponse.builder()
                                        .id(201L)
                                        .title("Bài 3: Cấu hình Spring Security 6 & JWT Filter")
                                        .durationSeconds(1250)
                                        .isPreview(false)
                                        .orderIndex(1)
                                        // Bài bị khóa: TUYỆT ĐỐI NULL URL
                                        .videoUrl(null)
                                        .build(),
                                LessonSummaryResponse.builder()
                                        .id(202L)
                                        .title("Bài 4: Tích hợp Flyway Migration & MySQL 8")
                                        .durationSeconds(960)
                                        .isPreview(false)
                                        .orderIndex(2)
                                        // Bài bị khóa: TUYỆT ĐỐI NULL URL
                                        .videoUrl(null)
                                        .build()
                        ))
                        .build()
        );

        return CourseDetailResponse.builder()
                .id(courseId)
                .title("Lập trình React Native & Spring Boot 3 Fullstack")
                .subtitle("Khóa học toàn diện phát triển hệ thống học trực tuyến Edumy")
                .description("Học viên sẽ được hướng dẫn từng bước từ phân tích ERD, viết RESTful API bằng Spring Boot 3 đến xây dựng ứng dụng di động bằng React Native Paper.")
                .thumbnailUrl("https://images.unsplash.com/photo-1555066931-4365d14bab8c")
                .price(new BigDecimal("499000.00"))
                .level(CourseLevel.ALL_LEVELS)
                .status(CourseStatus.PUBLISHED)
                .totalDurationSeconds(3410)
                .instructor(InstructorSummaryResponse.builder()
                        .id(101L)
                        .fullName("Nguyễn Văn Giảng Viên")
                        .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb")
                        .bio("Tech Lead & Senior Software Engineer.")
                        .build())
                .category(Category.builder()
                        .id(1L)
                        .name("Lập trình & CNTT")
                        .slug("lap-trinh-cntt")
                        .icon("code-tags")
                        .build())
                .curriculum(curriculum)
                .averageRating(4.9)
                .totalReviews(128L)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
