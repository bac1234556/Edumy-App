package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.learning.CertificateResponse;
import com.edumy.dto.learning.CertificateVerifyResponse;
import com.edumy.service.CertificateService;
import com.edumy.service.CertificateView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneId;

@RestController
@RequiredArgsConstructor
@Tag(name = "Certificate API", description = "Chứng chỉ hoàn thành khóa học: lấy, tải PDF và xác minh công khai")
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping({"/api/learn/courses/{courseId}/certificate", "/api/v1/learn/courses/{courseId}/certificate"})
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
            summary = "Chứng chỉ của tôi cho một khóa học",
            description = "Trả chứng chỉ khi tiến độ khóa đạt 100% (tự cấp bù nếu chưa có). " +
                          "Chưa hoàn thành: 404; chưa sở hữu khóa: 403."
    )
    public ResponseEntity<ApiResponse<CertificateResponse>> getMyCertificate(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long courseId
    ) {
        CertificateView view = certificateService.getForCourse(userId, courseId);
        return ResponseEntity.ok(ApiResponse.ok(CertificateResponse.builder()
                .code(view.code())
                .courseId(view.courseId())
                .courseTitle(view.courseTitle())
                .studentName(view.studentName())
                .instructorName(view.instructorName())
                .issuedAt(toOffset(view))
                .pdfPath("/api/certificates/" + view.code() + "/pdf")
                .build(), "Lấy chứng chỉ thành công"));
    }

    @GetMapping({"/api/certificates/{code}/verify", "/api/v1/certificates/{code}/verify"})
    @Operation(
            summary = "Xác minh chứng chỉ (công khai)",
            description = "Không cần đăng nhập. Mã hợp lệ trả thông tin chứng chỉ; mã không tồn tại trả 404."
    )
    public ResponseEntity<ApiResponse<CertificateVerifyResponse>> verify(@PathVariable String code) {
        CertificateView view = certificateService.verify(code);
        return ResponseEntity.ok(ApiResponse.ok(CertificateVerifyResponse.builder()
                .valid(true)
                .code(view.code())
                .studentName(view.studentName())
                .courseTitle(view.courseTitle())
                .instructorName(view.instructorName())
                .issuedAt(toOffset(view))
                .build(), "Chứng chỉ hợp lệ"));
    }

    // issuedAt lưu theo giờ JVM; gửi kèm offset để app đổi đúng sang múi giờ của thiết bị.
    private static OffsetDateTime toOffset(CertificateView view) {
        return view.issuedAt() == null ? null : view.issuedAt().atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }

    @GetMapping({"/api/certificates/{code}/pdf", "/api/v1/certificates/{code}/pdf"})
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
            summary = "Tải chứng chỉ PDF",
            description = "Chỉ chủ chứng chỉ tải được (403 với người khác, 404 nếu mã không tồn tại)."
    )
    public ResponseEntity<byte[]> downloadPdf(@AuthenticationPrincipal Long userId, @PathVariable String code) {
        byte[] pdf = certificateService.renderPdf(userId, code);
        String normalized = code.trim().toUpperCase();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("chung-chi-" + normalized + ".pdf").build().toString())
                .body(pdf);
    }
}
