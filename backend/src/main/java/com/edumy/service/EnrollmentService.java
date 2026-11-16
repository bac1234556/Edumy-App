package com.edumy.service;

import com.edumy.config.PaymentProperties;
import com.edumy.dto.learning.CreateOrderRequest;
import com.edumy.dto.learning.EnrollmentResponse;
import com.edumy.dto.learning.OrderResponse;
import com.edumy.entity.*;
import com.edumy.exception.ConflictException;
import com.edumy.exception.ForbiddenException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final PaymentProperties paymentProperties;
    private final VnpayGateway vnpayGateway;

    @Transactional
    public OrderResponse checkout(Long userId, CreateOrderRequest request, String clientIp) {
        requireConfiguredMethod(request.getPaymentMethod());
        String appRedirect = resolveAppRedirect(request.getReturnUri());
        Course course = courseRepository.findByIdAndStatus(request.getCourseId(), CourseStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khóa học đang mở bán với ID: " + request.getCourseId()));

        if (userId.equals(course.getInstructorId())) {
            throw new ForbiddenException("Bạn không thể mua khóa học do chính mình giảng dạy");
        }
        if (enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId())) {
            throw new ConflictException("Bạn đã sở hữu khóa học này");
        }

        BigDecimal price = course.getPrice() == null ? BigDecimal.ZERO : course.getPrice();
        if (price.signum() == 0) {
            Enrollment enrollment = enroll(Enrollment.builder()
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

        if (paymentProperties.isVnpay()) {
            // Chưa ghi danh: chỉ tạo đơn PENDING, ghi danh khi VNPay báo thành công (Return URL / IPN đã xác minh checksum).
            Order pending = orderRepository.saveAndFlush(Order.builder()
                    .userId(userId)
                    .courseId(course.getId())
                    .amount(price)
                    .status(OrderStatus.PENDING)
                    .paymentMethod(PaymentMethod.VNPAY)
                    .txnRef(newTxnRef())
                    .build());
            return OrderResponse.builder()
                    .orderId(pending.getId())
                    .txnRef(pending.getTxnRef())
                    .courseId(course.getId())
                    .courseTitle(course.getTitle())
                    .amount(pending.getAmount())
                    .status(OrderStatus.PENDING.name())
                    .paymentMethod(PaymentMethod.VNPAY.name())
                    .paymentUrl(vnpayGateway.buildPaymentUrl(pending, clientIp, appRedirect))
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

        Enrollment enrollment = enroll(Enrollment.builder()
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

    /**
     * Hai lần bấm thanh toán gần như đồng thời cùng qua bước kiểm tra "đã sở hữu"; lần chậm hơn vi phạm
     * ràng buộc UNIQUE (user, course). Báo đúng lỗi "đã sở hữu" thay vì lỗi hệ thống chung; giao dịch bị hoàn tác nên không mất đơn thừa.
     */
    private Enrollment enroll(Enrollment enrollment) {
        try {
            return enrollmentRepository.saveAndFlush(enrollment);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Bạn đã sở hữu khóa học này");
        }
    }

    /** Phương thức gửi lên (nếu có) phải trùng cổng đang bật, để không dùng MOCK qua mặt thanh toán thật. */
    private void requireConfiguredMethod(String requested) {
        if (requested != null && !requested.equalsIgnoreCase(paymentProperties.providerName())) {
            throw new IllegalArgumentException("Phương thức thanh toán " + requested + " hiện không khả dụng");
        }
    }

    private String resolveAppRedirect(String returnUri) {
        if (returnUri == null || returnUri.isBlank()) {
            return paymentProperties.getAppRedirect();
        }
        if (!paymentProperties.isAllowedRedirect(returnUri)) {
            throw new IllegalArgumentException("Địa chỉ quay về app không hợp lệ");
        }
        return returnUri;
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
