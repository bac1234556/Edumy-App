package com.edumy.service;

import com.edumy.dto.learning.CreateOrderRequest;
import com.edumy.dto.learning.EnrollmentResponse;
import com.edumy.dto.learning.OrderResponse;
import com.edumy.entity.*;
import com.edumy.exception.ConflictException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * W8-D1 (Issue #45): mock checkout và danh sách khóa học đã ghi danh.
 * Khóa có phí: Order PENDING -> giả lập thanh toán -> PAID -> Enrollment.
 * Khóa 0đ: tạo Enrollment trực tiếp, không phát sinh Order.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    private static final DateTimeFormatter TXN_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;

    @Transactional
    public OrderResponse checkout(Long userId, CreateOrderRequest request) {
        Course course = courseRepository.findByIdAndStatus(request.getCourseId(), CourseStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khóa học đang mở bán với ID: " + request.getCourseId()));

        if (enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId())) {
            throw new ConflictException("Bạn đã sở hữu khóa học này");
        }

        BigDecimal price = course.getPrice() == null ? BigDecimal.ZERO : course.getPrice();
        if (price.signum() == 0) {
            Enrollment enrollment = enrollmentRepository.saveAndFlush(Enrollment.builder()
                    .userId(userId).courseId(course.getId()).build());
            return OrderResponse.builder()
                    .courseId(course.getId())
                    .courseTitle(course.getTitle())
                    .amount(BigDecimal.ZERO)
                    .status("FREE")
                    .enrollmentId(enrollment.getId())
                    .enrolledAt(enrollment.getCreatedAt())
                    .build();
        }

        Order order = orderRepository.saveAndFlush(Order.builder()
                .userId(userId)
                .courseId(course.getId())
                .amount(price)
                .status(OrderStatus.PENDING)
                .paymentMethod(PaymentMethod.MOCK)
                .txnRef(newTxnRef())
                .build());

        // Giả lập cổng thanh toán trả về thành công ngay lập tức.
        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        orderRepository.save(order);

        Enrollment enrollment = enrollmentRepository.saveAndFlush(Enrollment.builder()
                .userId(userId).courseId(course.getId()).orderId(order.getId()).build());

        return OrderResponse.builder()
                .orderId(order.getId())
                .txnRef(order.getTxnRef())
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .amount(order.getAmount())
                .status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod().name())
                .paidAt(order.getPaidAt())
                .enrollmentId(enrollment.getId())
                .enrolledAt(enrollment.getCreatedAt())
                .build();
    }

    public List<EnrollmentResponse> getMyCourses(Long userId) {
        return enrollmentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(enrollment -> courseRepository.findById(enrollment.getCourseId())
                        .map(course -> toResponse(enrollment, course))
                        .orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private EnrollmentResponse toResponse(Enrollment enrollment, Course course) {
        List<Long> sectionIds = sectionRepository.findByCourseIdOrderByOrderIndexAsc(course.getId()).stream()
                .map(Section::getId).toList();
        int totalLessons = sectionIds.isEmpty() ? 0
                : lessonRepository.findBySectionIdInOrderByOrderIndexAsc(sectionIds).size();
        int completedLessons = (int) lessonProgressRepository.countByEnrollmentIdAndCompletedTrue(enrollment.getId());
        String instructorName = userRepository.findById(course.getInstructorId()).map(User::getFullName).orElse(null);

        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .thumbnailUrl(course.getThumbnailUrl())
                .instructorName(instructorName)
                .progressPercent(enrollment.getProgressPercent())
                .completedLessons(completedLessons)
                .totalLessons(totalLessons)
                .enrolledAt(enrollment.getCreatedAt())
                .completedAt(enrollment.getCompletedAt())
                .build();
    }

    private String newTxnRef() {
        return "EDU" + LocalDateTime.now().format(TXN_TIME) + String.format("%06d", RANDOM.nextInt(1_000_000));
    }
}
