package com.edumy.service;

import com.edumy.entity.Certificate;
import com.edumy.entity.Course;
import com.edumy.entity.Enrollment;
import com.edumy.entity.User;
import com.edumy.exception.ForbiddenException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CertificateRepository;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.EnrollmentRepository;
import com.edumy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Year;
import java.util.Locale;

/**
 * W9-D3 (Issue #75): cấp chứng chỉ khi enrollment đạt 100%, tra cứu công khai và xuất PDF.
 * Mã chứng chỉ có dạng EDUMY-&lt;NĂM&gt;-&lt;8 ký tự ngẫu nhiên&gt;, duy nhất (có ràng buộc UNIQUE ở DB).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateService {

    // Bỏ các ký tự dễ nhầm (0/O, 1/I) để học viên dễ đọc và nhập mã.
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int RANDOM_LENGTH = 8;
    private static final int MAX_CODE_ATTEMPTS = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CertificateRepository certificateRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CertificatePdfRenderer pdfRenderer;

    /** Cấp chứng chỉ nếu enrollment đã đạt 100% và chưa có; trả null nếu chưa đủ điều kiện. */
    @Transactional
    public Certificate issueIfEligible(Enrollment enrollment) {
        if (enrollment.getProgressPercent() == null || enrollment.getProgressPercent() < 100) {
            return null;
        }
        return certificateRepository.findByEnrollmentId(enrollment.getId())
                .orElseGet(() -> certificateRepository.save(Certificate.builder()
                        .enrollmentId(enrollment.getId())
                        .code(newUniqueCode())
                        .build()));
    }

    /** Chứng chỉ của học viên cho một khóa; tự cấp bù nếu đã đủ 100% từ trước khi có tính năng này. */
    @Transactional
    public CertificateView getForCourse(Long userId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ForbiddenException("Bạn chưa sở hữu khóa học này"));
        Certificate certificate = issueIfEligible(enrollment);
        if (certificate == null) {
            throw new ResourceNotFoundException("Bạn chưa hoàn thành khóa học nên chưa có chứng chỉ");
        }
        return toView(certificate, enrollment);
    }

    public CertificateView verify(String code) {
        Certificate certificate = findByCode(code);
        Enrollment enrollment = enrollmentRepository.findById(certificate.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Mã chứng chỉ không tồn tại"));
        return toView(certificate, enrollment);
    }

    public byte[] renderPdf(Long userId, String code) {
        Certificate certificate = findByCode(code);
        Enrollment enrollment = enrollmentRepository.findById(certificate.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Mã chứng chỉ không tồn tại"));
        if (!enrollment.getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền tải chứng chỉ này");
        }
        return pdfRenderer.render(toView(certificate, enrollment));
    }

    static String generateCode() {
        StringBuilder random = new StringBuilder(RANDOM_LENGTH);
        for (int i = 0; i < RANDOM_LENGTH; i++) {
            random.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return "EDUMY-" + Year.now().getValue() + "-" + random;
    }

    private String newUniqueCode() {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            String code = generateCode();
            if (certificateRepository.findByCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("Không tạo được mã chứng chỉ duy nhất");
    }

    private Certificate findByCode(String code) {
        String normalized = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        return certificateRepository.findByCode(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("Mã chứng chỉ không tồn tại"));
    }

    private CertificateView toView(Certificate certificate, Enrollment enrollment) {
        Course course = courseRepository.findById(enrollment.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học của chứng chỉ"));
        String student = userRepository.findById(enrollment.getUserId()).map(User::getFullName).orElse("Học viên Edumy");
        String instructor = userRepository.findById(course.getInstructorId()).map(User::getFullName).orElse(null);
        return new CertificateView(certificate.getCode(), course.getId(), course.getTitle(),
                student, instructor, certificate.getIssuedAt());
    }
}
