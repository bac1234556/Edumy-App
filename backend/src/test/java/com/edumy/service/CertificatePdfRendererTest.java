package com.edumy.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openpdf.text.PageSize;
import org.openpdf.text.pdf.PdfReader;
import org.openpdf.text.pdf.parser.PdfTextExtractor;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class CertificatePdfRendererTest {

    private final CertificatePdfRenderer renderer = new CertificatePdfRenderer();

    private PdfReader read(CertificateView view) throws Exception {
        return new PdfReader(renderer.render(view));
    }

    @Test
    @DisplayName("Chứng chỉ luôn nằm trên một trang A4 ngang")
    void singleLandscapePage() throws Exception {
        PdfReader reader = read(new CertificateView("EDUMY-2026-K7M2QX4P", 1L, "Lập trình React Native & Expo thực chiến 2026",
                "Nguyễn Thị Thủy Ngân", "Trần Văn Chuyên", LocalDateTime.of(2026, 11, 16, 10, 30)));
        assertEquals(1, reader.getNumberOfPages());
        assertEquals(PageSize.A4.getHeight(), reader.getPageSizeWithRotation(1).getWidth(), 0.5f);
        assertEquals(PageSize.A4.getWidth(), reader.getPageSizeWithRotation(1).getHeight(), 0.5f);
        assertTrue(new PdfTextExtractor(reader).getTextFromPage(1).contains("16/11/2026"));
    }

    @Test
    @DisplayName("Tên khóa học và học viên rất dài vẫn gói trong một trang")
    void veryLongNamesStillFitOnOnePage() throws Exception {
        String longTitle = "Chương trình đào tạo toàn diện về lập trình ứng dụng di động đa nền tảng với React Native, "
                + "Expo, TypeScript, kiến trúc sạch và tối ưu hiệu năng cho người mới bắt đầu";
        PdfReader reader = read(new CertificateView("EDUMY-2026-K7M2QX4P", 1L, longTitle,
                "Nguyễn Hoàng Phương Thảo Nguyên Vĩnh An", "Lê Hoàng Nam", LocalDateTime.of(2026, 11, 16, 10, 30)));
        assertEquals(1, reader.getNumberOfPages());
    }

    @Test
    @DisplayName("Thiếu giảng viên hoặc ngày cấp vẫn tạo được PDF")
    void optionalFieldsMayBeMissing() throws Exception {
        PdfReader reader = read(new CertificateView("EDUMY-2026-K7M2QX4P", 1L, "Khóa học", "Học viên", null, null));
        String text = new PdfTextExtractor(reader).getTextFromPage(1);
        assertFalse(text.contains("Giảng viên"));
        assertTrue(text.contains("EDUMY-2026-K7M2QX4P"));
    }
}
