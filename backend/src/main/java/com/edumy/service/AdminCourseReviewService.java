package com.edumy.service;

import com.edumy.common.PageResponse;
import com.edumy.dto.admin.AdminCourseDetailResponse;
import com.edumy.dto.admin.AdminCourseSummaryResponse;
import com.edumy.dto.admin.AdminLessonDetailResponse;
import com.edumy.dto.admin.AdminSectionDetailResponse;
import com.edumy.dto.course.InstructorSummaryResponse;
import com.edumy.entity.*;
import com.edumy.exception.ConflictException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminCourseReviewService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminCourseSummaryResponse> getPendingCourses(Pageable pageable) {
        Page<Course> courses = courseRepository.findByStatusOrderByCreatedAtAsc(CourseStatus.PENDING, pageable);
        List<Long> instructorIds = courses.getContent().stream().map(Course::getInstructorId).distinct().toList();
        List<Long> categoryIds = courses.getContent().stream().map(Course::getCategoryId).distinct().toList();
        Map<Long, User> instructors = userRepository.findAllById(instructorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Category> categories = categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));

        return PageResponse.<AdminCourseSummaryResponse>builder()
                .content(courses.getContent().stream()
                        .map(course -> AdminCourseSummaryResponse.builder()
                                .id(course.getId())
                                .title(course.getTitle())
                                .subtitle(course.getSubtitle())
                                .thumbnailUrl(course.getThumbnailUrl())
                                .price(course.getPrice())
                                .level(course.getLevel())
                                .status(course.getStatus())
                                .totalDurationSeconds(course.getTotalDurationSeconds())
                                .instructorId(course.getInstructorId())
                                .instructorName(instructors.containsKey(course.getInstructorId())
                                        ? instructors.get(course.getInstructorId()).getFullName() : null)
                                .categoryId(course.getCategoryId())
                                .categoryName(categories.containsKey(course.getCategoryId())
                                        ? categories.get(course.getCategoryId()).getName() : null)
                                .createdAt(course.getCreatedAt())
                                .build())
                        .toList())
                .page(courses.getNumber())
                .size(courses.getSize())
                .totalElements(courses.getTotalElements())
                .totalPages(courses.getTotalPages())
                .last(courses.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public AdminCourseDetailResponse getCourseDetail(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + courseId));
        User instructor = userRepository.findById(course.getInstructorId()).orElse(null);
        Category category = categoryRepository.findById(course.getCategoryId()).orElse(null);
        List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        List<Long> sectionIds = sections.stream().map(Section::getId).toList();
        Map<Long, List<Lesson>> lessonsBySection = sectionIds.isEmpty()
                ? Map.of()
                : lessonRepository.findBySectionIdInOrderByOrderIndexAsc(sectionIds).stream()
                        .collect(Collectors.groupingBy(Lesson::getSectionId));

        List<AdminSectionDetailResponse> curriculum = sections.stream()
                .map(section -> AdminSectionDetailResponse.builder()
                        .id(section.getId())
                        .title(section.getTitle())
                        .orderIndex(section.getOrderIndex())
                        .lessons(lessonsBySection.getOrDefault(section.getId(), List.of()).stream()
                                .map(lesson -> AdminLessonDetailResponse.builder()
                                        .id(lesson.getId())
                                        .title(lesson.getTitle())
                                        .videoUrl(lesson.getVideoUrl())
                                        .durationSeconds(lesson.getDurationSeconds())
                                        .isPreview(lesson.getIsPreview())
                                        .orderIndex(lesson.getOrderIndex())
                                        .build())
                                .toList())
                        .build())
                .toList();

        return AdminCourseDetailResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .subtitle(course.getSubtitle())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .price(course.getPrice())
                .level(course.getLevel())
                .status(course.getStatus())
                .rejectionReason(course.getRejectionReason())
                .totalDurationSeconds(course.getTotalDurationSeconds())
                .instructor(instructor == null ? null : InstructorSummaryResponse.builder()
                        .id(instructor.getId())
                        .fullName(instructor.getFullName())
                        .avatarUrl(instructor.getAvatarUrl())
                        .bio(instructor.getBio())
                        .build())
                .category(category)
                .curriculum(curriculum)
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }

    @Transactional
    public AdminCourseDetailResponse approveCourse(Long courseId) {
        Course course = getPendingCourse(courseId);
        course.setStatus(CourseStatus.PUBLISHED);
        course.setRejectionReason(null);
        Course saved = courseRepository.save(course);
        createNotification(saved, NotificationType.COURSE_APPROVED,
                "Khóa học đã được phê duyệt", "Khóa học \"" + saved.getTitle() + "\" đã được phê duyệt và xuất bản.");
        log.info("Admin approved course id={}, instructorId={}", saved.getId(), saved.getInstructorId());
        return getCourseDetail(saved.getId());
    }

    @Transactional
    public AdminCourseDetailResponse rejectCourse(Long courseId, String rejectionReason) {
        Course course = getPendingCourse(courseId);
        String normalizedReason = rejectionReason.trim();
        course.setStatus(CourseStatus.REJECTED);
        course.setRejectionReason(normalizedReason);
        Course saved = courseRepository.save(course);
        createNotification(saved, NotificationType.COURSE_REJECTED,
                "Khóa học cần chỉnh sửa",
                "Khóa học \"" + saved.getTitle() + "\" chưa được phê duyệt. Lý do: " + normalizedReason);
        log.info("Admin rejected course id={}, instructorId={}", saved.getId(), saved.getInstructorId());
        return getCourseDetail(saved.getId());
    }

    private Course getPendingCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + courseId));
        if (course.getStatus() != CourseStatus.PENDING) {
            throw new ConflictException("Chỉ khóa học đang chờ duyệt mới có thể được phê duyệt hoặc từ chối");
        }
        return course;
    }

    private void createNotification(Course course, NotificationType type, String title, String body) {
        notificationRepository.save(Notification.builder()
                .userId(course.getInstructorId())
                .type(type)
                .title(title)
                .body(body)
                .build());
    }
}
