package com.edumy.repository;

import com.edumy.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class LearningSchemaTest {

    @Autowired
    private OrderRepository orders;

    @Autowired
    private EnrollmentRepository enrollments;

    @Autowired
    private LessonProgressRepository lessonProgress;

    @Autowired
    private CertificateRepository certificates;

    @Test
    @DisplayName("Order mới mặc định PENDING / MOCK và tra cứu được theo txn_ref")
    void orderDefaults() {
        Order saved = orders.saveAndFlush(Order.builder()
                .userId(1L).courseId(1L).amount(new BigDecimal("499000.00")).txnRef("EDU-TXN-1").build());

        assertEquals(OrderStatus.PENDING, saved.getStatus());
        assertEquals(PaymentMethod.MOCK, saved.getPaymentMethod());
        assertNotNull(saved.getCreatedAt());
        assertTrue(orders.findByTxnRef("EDU-TXN-1").isPresent());
    }

    @Test
    @DisplayName("txn_ref là duy nhất")
    void duplicateTxnRefRejected() {
        orders.saveAndFlush(Order.builder().userId(1L).courseId(1L).txnRef("EDU-TXN-DUP").build());
        assertThrows(DataIntegrityViolationException.class, () ->
                orders.saveAndFlush(Order.builder().userId(2L).courseId(2L).txnRef("EDU-TXN-DUP").build()));
    }

    @Test
    @DisplayName("Mỗi học viên chỉ có 1 enrollment cho mỗi khóa học")
    void duplicateEnrollmentRejected() {
        Enrollment first = enrollments.saveAndFlush(Enrollment.builder().userId(10L).courseId(20L).build());
        assertEquals(0, first.getProgressPercent());
        assertTrue(enrollments.existsByUserIdAndCourseId(10L, 20L));

        assertThrows(DataIntegrityViolationException.class, () ->
                enrollments.saveAndFlush(Enrollment.builder().userId(10L).courseId(20L).build()));
    }

    @Test
    @DisplayName("Mỗi enrollment chỉ có 1 bản ghi tiến độ cho mỗi bài học")
    void duplicateLessonProgressRejected() {
        LessonProgress progress = lessonProgress.saveAndFlush(LessonProgress.builder()
                .enrollmentId(1L).lessonId(5L).lastPositionSec(42).completed(true).build());
        assertEquals(1, lessonProgress.countByEnrollmentIdAndCompletedTrue(1L));
        assertEquals(42, progress.getLastPositionSec());

        assertThrows(DataIntegrityViolationException.class, () ->
                lessonProgress.saveAndFlush(LessonProgress.builder().enrollmentId(1L).lessonId(5L).build()));
    }

    @Test
    @DisplayName("Mã chứng chỉ là duy nhất")
    void duplicateCertificateCodeRejected() {
        Certificate cert = certificates.saveAndFlush(Certificate.builder()
                .enrollmentId(1L).code("EDUMY-2026-ABC123").build());
        assertNotNull(cert.getIssuedAt());
        assertTrue(certificates.findByCode("EDUMY-2026-ABC123").isPresent());

        assertThrows(DataIntegrityViolationException.class, () ->
                certificates.saveAndFlush(Certificate.builder().enrollmentId(2L).code("EDUMY-2026-ABC123").build()));
    }

    @Test
    @DisplayName("Mỗi enrollment chỉ được cấp 1 chứng chỉ")
    void secondCertificateForEnrollmentRejected() {
        certificates.saveAndFlush(Certificate.builder().enrollmentId(3L).code("EDUMY-2026-AAA111").build());
        assertThrows(DataIntegrityViolationException.class, () ->
                certificates.saveAndFlush(Certificate.builder().enrollmentId(3L).code("EDUMY-2026-BBB222").build()));
    }
}
