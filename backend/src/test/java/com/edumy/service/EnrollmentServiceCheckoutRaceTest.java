package com.edumy.service;

import com.edumy.config.PaymentProperties;
import com.edumy.dto.learning.CreateOrderRequest;
import com.edumy.entity.Course;
import com.edumy.entity.CourseStatus;
import com.edumy.exception.ConflictException;
import com.edumy.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EnrollmentServiceCheckoutRaceTest {

    private CourseRepository courses;
    private EnrollmentRepository enrollments;
    private OrderRepository orders;
    private EnrollmentService service;

    @BeforeEach
    void setUp() {
        courses = mock(CourseRepository.class);
        enrollments = mock(EnrollmentRepository.class);
        orders = mock(OrderRepository.class);
        PaymentProperties properties = new PaymentProperties();
        service = new EnrollmentService(courses, mock(SectionRepository.class), mock(LessonRepository.class),
                mock(UserRepository.class), orders, enrollments, mock(LessonProgressRepository.class),
                properties, new VnpayGateway(properties));
        when(courses.findByIdAndStatus(1L, CourseStatus.PUBLISHED)).thenReturn(Optional.of(
                Course.builder().id(1L).instructorId(99L).categoryId(1L).title("Khóa").price(BigDecimal.ZERO)
                        .status(CourseStatus.PUBLISHED).build()));
        when(enrollments.existsByUserIdAndCourseId(5L, 1L)).thenReturn(false);
    }

    @Test
    @DisplayName("Hai lần bấm thanh toán gần như đồng thời: lần thua cuộc nhận lỗi 409 rõ ràng, không phải lỗi hệ thống chung")
    void concurrentDuplicateEnrollmentIsReportedAsAlreadyOwned() {
        when(enrollments.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("uk_enrollments_user_course"));
        CreateOrderRequest request = CreateOrderRequest.builder().courseId(1L).build();

        ConflictException error = assertThrows(ConflictException.class, () -> service.checkout(5L, request, "127.0.0.1"));
        assertEquals("Bạn đã sở hữu khóa học này", error.getMessage());
    }
}
