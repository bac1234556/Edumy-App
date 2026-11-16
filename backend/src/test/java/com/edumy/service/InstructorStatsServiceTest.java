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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InstructorStatsServiceTest {

    @Mock
    private CourseRepository courseRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private SectionRepository sectionRepository;
    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private LessonProgressRepository lessonProgressRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InstructorStatsService instructorStatsService;

    @Test
    void getInstructorStatsReturnsAggregatedValues() {
        when(courseRepository.countByInstructorId(1L)).thenReturn(3L);
        when(enrollmentRepository.countDistinctStudentsByInstructorId(1L)).thenReturn(12L);
        when(orderRepository.sumPaidAmountByInstructorId(1L)).thenReturn(new BigDecimal("1250000.00"));
        when(reviewRepository.calculateAverageRatingByInstructorId(1L)).thenReturn(4.5);

        InstructorStatsResponse response = instructorStatsService.getInstructorStats(1L);

        assertEquals(3L, response.getTotalCourses());
        assertEquals(12L, response.getTotalStudents());
        assertEquals(new BigDecimal("1250000.00"), response.getTotalRevenue());
        assertEquals(4.5, response.getAverageRating());
    }

    @Test
    void getInstructorStatsUsesZeroWhenNoRevenueOrReviewsExist() {
        when(courseRepository.countByInstructorId(1L)).thenReturn(0L);
        when(enrollmentRepository.countDistinctStudentsByInstructorId(1L)).thenReturn(0L);
        when(orderRepository.sumPaidAmountByInstructorId(1L)).thenReturn(BigDecimal.ZERO);
        when(reviewRepository.calculateAverageRatingByInstructorId(1L)).thenReturn(0.0);

        InstructorStatsResponse response = instructorStatsService.getInstructorStats(1L);

        assertEquals(0L, response.getTotalCourses());
        assertEquals(0L, response.getTotalStudents());
        assertEquals(BigDecimal.ZERO, response.getTotalRevenue());
        assertEquals(0.0, response.getAverageRating());
    }

    @Test
    void getCourseStudentsCalculatesProgressAndReturnsStudentInformation() {
        Long courseId = 10L;
        Long enrollmentId = 20L;
        LocalDateTime enrolledAt = LocalDateTime.of(2026, 11, 1, 10, 0);
        Course course = Course.builder().id(courseId).instructorId(1L).build();
        Enrollment enrollment = Enrollment.builder()
                .id(enrollmentId)
                .userId(30L)
                .courseId(courseId)
                .createdAt(enrolledAt)
                .build();
        User user = User.builder()
                .id(30L)
                .fullName("Demo Student")
                .email("student@example.com")
                .avatarUrl("https://example.com/avatar.png")
                .build();
        Page<Enrollment> enrollmentPage = new PageImpl<>(List.of(enrollment), PageRequest.of(0, 10), 1);

        when(courseRepository.findByIdAndInstructorId(courseId, 1L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.findByCourseIdOrderByCreatedAtDesc(eq(courseId), any()))
                .thenReturn(enrollmentPage);
        when(userRepository.findAllById(List.of(30L))).thenReturn(List.of(user));
        when(sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId)).thenReturn(List.of(
                com.edumy.entity.Section.builder().id(100L).courseId(courseId).build(),
                com.edumy.entity.Section.builder().id(101L).courseId(courseId).build()
        ));
        when(lessonRepository.countBySectionIdIn(List.of(100L, 101L))).thenReturn(4L);
        when(lessonProgressRepository.countByEnrollmentIdAndCompletedTrue(enrollmentId)).thenReturn(3L);

        Page<InstructorStudentResponse> response = instructorStatsService.getCourseStudents(
                courseId, 1L, PageRequest.of(0, 10));

        assertEquals(1, response.getTotalElements());
        InstructorStudentResponse student = response.getContent().get(0);
        assertEquals(enrollmentId, student.getEnrollmentId());
        assertEquals(30L, student.getUserId());
        assertEquals("Demo Student", student.getFullName());
        assertEquals("student@example.com", student.getEmail());
        assertEquals("https://example.com/avatar.png", student.getAvatarUrl());
        assertEquals(75, student.getProgressPercent());
        assertEquals(enrolledAt, student.getEnrolledAt());
    }

    @Test
    void getCourseStudentsReturnsZeroProgressWhenCourseHasNoLessons() {
        Long courseId = 10L;
        Enrollment enrollment = Enrollment.builder().id(20L).userId(30L).courseId(courseId).build();
        when(courseRepository.findByIdAndInstructorId(courseId, 1L))
                .thenReturn(Optional.of(Course.builder().id(courseId).instructorId(1L).build()));
        when(enrollmentRepository.findByCourseIdOrderByCreatedAtDesc(eq(courseId), any()))
                .thenReturn(new PageImpl<>(List.of(enrollment)));
        when(userRepository.findAllById(List.of(30L))).thenReturn(List.of(User.builder().id(30L).build()));
        when(sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId)).thenReturn(List.of());

        Page<InstructorStudentResponse> response = instructorStatsService.getCourseStudents(
                courseId, 1L, PageRequest.of(0, 10));

        assertEquals(0, response.getContent().get(0).getProgressPercent());
        verify(lessonRepository, never()).countBySectionIdIn(any());
        verify(lessonProgressRepository, never()).countByEnrollmentIdAndCompletedTrue(any());
    }

    @Test
    void getCourseStudentsRejectsCourseOwnedByAnotherInstructor() {
        when(courseRepository.findByIdAndInstructorId(10L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> instructorStatsService.getCourseStudents(
                10L, 1L, PageRequest.of(0, 10)));

        verify(enrollmentRepository, never()).findByCourseIdOrderByCreatedAtDesc(any(), any());
    }
}
