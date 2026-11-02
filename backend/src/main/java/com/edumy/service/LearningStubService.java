package com.edumy.service;

import com.edumy.dto.course.CourseDetailResponse;
import com.edumy.dto.learning.CreateOrderRequest;
import com.edumy.dto.learning.EnrollmentResponse;
import com.edumy.dto.learning.OrderResponse;
import com.edumy.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Stub W7-D3 (Issue #15): chưa ghi DB. Tuần 8 thay bằng OrderService/EnrollmentService
 * dùng các bảng orders, enrollments của W7-D1 (#13).
 */
@Service
@RequiredArgsConstructor
public class LearningStubService {

    private static final DateTimeFormatter TXN_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CoursePublicService coursePublicService;

    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        CourseDetailResponse course;
        try {
            course = coursePublicService.getCourseDetail(request.getCourseId());
        } catch (NoSuchElementException ex) {
            throw new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + request.getCourseId());
        }
        LocalDateTime now = LocalDateTime.now();
        return OrderResponse.builder()
                .txnRef("EDU" + now.format(TXN_TIME) + String.format("%06d", RANDOM.nextInt(1_000_000)))
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .amount(course.getPrice())
                .status("PENDING")
                .paymentMethod(request.getPaymentMethod() == null ? "MOCK" : request.getPaymentMethod())
                .createdAt(now)
                .build();
    }

    public List<EnrollmentResponse> getMyEnrollments(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                EnrollmentResponse.builder()
                        .id(1L).courseId(1L)
                        .courseTitle("Lập trình React Native & Expo thực chiến 2026")
                        .thumbnailUrl("https://images.unsplash.com/photo-1555066931-4365d14bab8c")
                        .instructorName("Trần Văn Chuyên")
                        .progressPercent(33).completedLessons(3).totalLessons(9)
                        .enrolledAt(now.minusDays(5))
                        .build(),
                EnrollmentResponse.builder()
                        .id(2L).courseId(3L)
                        .courseTitle("Thiết kế UI/UX Chuyên nghiệp với Figma")
                        .thumbnailUrl("https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e")
                        .instructorName("Phạm Mỹ Linh")
                        .progressPercent(100).completedLessons(6).totalLessons(6)
                        .enrolledAt(now.minusDays(20)).completedAt(now.minusDays(2))
                        .build()
        );
    }
}
