package com.edumy.service;

import com.edumy.dto.learning.OrderResponse;
import com.edumy.entity.*;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.EnrollmentRepository;
import com.edumy.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * W10-D1 (Issue #95): xử lý kết quả VNPay từ Return URL và IPN.
 * Chỉ chấp nhận khi checksum đúng và số tiền khớp đơn; xử lý lặp lại an toàn (idempotent).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    public enum Outcome { OK, ALREADY_CONFIRMED, ORDER_NOT_FOUND, INVALID_AMOUNT, INVALID_SIGNATURE }

    /** @param order đơn hàng (null nếu chưa tìm thấy); @param paid true khi giao dịch thành công. */
    public record VnpayResult(Outcome outcome, Order order, boolean paid) {}

    private final VnpayGateway gateway;
    private final OrderRepository orderRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public VnpayResult confirmVnpay(Map<String, String> requestParams) {
        Map<String, String> params = new HashMap<>();
        requestParams.forEach((key, value) -> {
            if (key.startsWith("vnp_")) {
                params.put(key, value);
            }
        });
        if (!gateway.verify(params)) {
            return new VnpayResult(Outcome.INVALID_SIGNATURE, null, false);
        }

        Order order = orderRepository.findByTxnRef(params.getOrDefault("vnp_TxnRef", "")).orElse(null);
        if (order == null || order.getPaymentMethod() != PaymentMethod.VNPAY) {
            return new VnpayResult(Outcome.ORDER_NOT_FOUND, null, false);
        }
        if (!String.valueOf(VnpayGateway.amountInSmallestUnit(order)).equals(params.get("vnp_Amount"))) {
            return new VnpayResult(Outcome.INVALID_AMOUNT, order, false);
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            return new VnpayResult(Outcome.ALREADY_CONFIRMED, order, order.getStatus() == OrderStatus.PAID);
        }

        boolean success = "00".equals(params.get("vnp_ResponseCode"))
                && (!params.containsKey("vnp_TransactionStatus") || "00".equals(params.get("vnp_TransactionStatus")));
        if (success) {
            order.setStatus(OrderStatus.PAID);
            order.setPaidAt(LocalDateTime.now());
            orderRepository.save(order);
            if (!enrollmentRepository.existsByUserIdAndCourseId(order.getUserId(), order.getCourseId())) {
                enrollmentRepository.saveAndFlush(Enrollment.builder()
                        .userId(order.getUserId()).courseId(order.getCourseId()).orderId(order.getId()).build());
            }
        } else {
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
        }
        return new VnpayResult(Outcome.OK, order, success);
    }

    /** Trạng thái đơn hàng cho chính chủ đơn (app gọi sau khi quay về từ trang thanh toán). */
    public OrderResponse getOrder(Long userId, String txnRef) {
        Order order = orderRepository.findByTxnRef(txnRef)
                .filter(o -> o.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        String title = courseRepository.findById(order.getCourseId()).map(Course::getTitle).orElse(null);
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, order.getCourseId()).orElse(null);
        return OrderResponse.builder()
                .orderId(order.getId())
                .txnRef(order.getTxnRef())
                .courseId(order.getCourseId())
                .courseTitle(title)
                .amount(order.getAmount())
                .status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod().name())
                .paidAt(order.getPaidAt())
                .enrollmentId(enrollment != null ? enrollment.getId() : null)
                .enrolledAt(enrollment != null ? enrollment.getCreatedAt() : null)
                .build();
    }
}
