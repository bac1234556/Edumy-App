package com.edumy.service;

import java.time.LocalDateTime;

/** Dữ liệu đã tổng hợp của một chứng chỉ, dùng chung cho API và PDF. */
public record CertificateView(
        String code,
        Long courseId,
        String courseTitle,
        String studentName,
        String instructorName,
        LocalDateTime issuedAt
) {}
