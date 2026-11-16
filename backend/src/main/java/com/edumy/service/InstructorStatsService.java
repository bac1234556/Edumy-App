package com.edumy.service;

import com.edumy.dto.instructor.InstructorStatsResponse;
import com.edumy.dto.instructor.InstructorStudentResponse;
import com.edumy.entity.Course;
import com.edumy.entity.Enrollment;
import com.edumy.entity.User;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.EnrollmentRepository;
import com.edumy.repository.LessonProgressRepository;
import com.edumy.repository.LessonRepository;
import com.edumy.repository.OrderRepository;
import com.edumy.repository.ReviewRepository;
import com.edumy.repository.SectionRepository;
import com.edumy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstructorStatsService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public InstructorStatsResponse getInstructorStats(Long instructorId) {
        long totalCourses = courseRepository.countByInstructorId(instructorId);
        long totalStudents = enrollmentRepository.countDistinctStudentsByInstructorId(instructorId);
        BigDecimal totalRevenue = orderRepository.sumPaidAmountByInstructorId(instructorId);
        Double averageRating = reviewRepository.calculateAverageRatingByInstructorId(instructorId);

        return InstructorStatsResponse.builder()
                .totalCourses(totalCourses)
                .totalStudents(totalStudents)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<InstructorStudentResponse> getCourseStudents(Long courseId, Long instructorId, Pageable pageable) {
        Course course = courseRepository.findByIdAndInstructorId(courseId, instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + courseId));

        Page<Enrollment> enrollments = enrollmentRepository.findByCourseIdOrderByCreatedAtDesc(course.getId(), pageable);
        if (enrollments.isEmpty()) {
            return enrollments.map(enrollment -> null);
        }

        List<Long> userIds = enrollments.getContent().stream()
                .map(Enrollment::getUserId)
                .distinct()
                .toList();
        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<Long> sectionIds = sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId).stream()
                .map(section -> section.getId())
                .toList();
        long totalLessons = sectionIds.isEmpty() ? 0 : lessonRepository.countBySectionIdIn(sectionIds);

        return enrollments.map(enrollment -> {
            User user = usersById.get(enrollment.getUserId());
            long completedLessons = totalLessons == 0
                    ? 0
                    : lessonProgressRepository.countByEnrollmentIdAndCompletedTrue(enrollment.getId());
            int progressPercent = totalLessons == 0
                    ? 0
                    : (int) Math.round(completedLessons * 100.0 / totalLessons);

            return InstructorStudentResponse.builder()
                    .enrollmentId(enrollment.getId())
                    .userId(enrollment.getUserId())
                    .fullName(user != null ? user.getFullName() : null)
                    .email(user != null ? user.getEmail() : null)
                    .avatarUrl(user != null ? user.getAvatarUrl() : null)
                    .progressPercent(Math.min(progressPercent, 100))
                    .enrolledAt(enrollment.getCreatedAt())
                    .build();
        });
    }
}
