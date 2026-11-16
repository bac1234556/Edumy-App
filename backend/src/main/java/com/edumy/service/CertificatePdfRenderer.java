package com.edumy.service;

import org.openpdf.text.Document;
import org.openpdf.text.DocumentException;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.pdf.BaseFont;
import org.openpdf.text.pdf.PdfContentByte;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;

/**
 * Vẽ chứng chỉ PDF bằng OpenPDF. Nhúng font Roboto (SIL OFL) vì font chuẩn của PDF
 * không có các chữ tiếng Việt có dấu như ệ, ạ, ư, ơ.
 */
@Component
public class CertificatePdfRenderer {

    private static final String REGULAR_FONT = "fonts/Roboto-Regular.ttf";
    private static final String BOLD_FONT = "fonts/Roboto-Bold.ttf";
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Color BLUE = new Color(0x25, 0x63, 0xEB);
    private static final Color DARK = new Color(0x0F, 0x17, 0x2A);
    private static final Color GREY = new Color(0x47, 0x55, 0x69);

    private final byte[] regularBytes = load(REGULAR_FONT);
    private final byte[] boldBytes = load(BOLD_FONT);

    public byte[] render(CertificateView view) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 60, 60, 50, 50);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.addTitle("Chứng chỉ hoàn thành - " + view.courseTitle());
            document.addAuthor("Edumy");
            document.open();
            drawBorder(writer.getDirectContent(), document);

            BaseFont regular = BaseFont.createFont("Roboto-Regular.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, regularBytes, null);
            BaseFont bold = BaseFont.createFont("Roboto-Bold.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, boldBytes, null);

            line(document, "EDUMY", font(bold, 20, BLUE), 0, 6);
            line(document, "CHỨNG CHỈ HOÀN THÀNH", font(bold, 34, DARK), 0, 18);
            line(document, "Chứng nhận", font(regular, 14, GREY), 0, 10);
            line(document, view.studentName(), font(bold, 30, DARK), 0, 10);
            line(document, "đã hoàn thành khóa học", font(regular, 14, GREY), 0, 10);
            line(document, view.courseTitle(), font(bold, 24, BLUE), 0, 16);
            if (view.instructorName() != null && !view.instructorName().isBlank()) {
                line(document, "Giảng viên: " + view.instructorName(), font(regular, 14, DARK), 0, 4);
            }
            if (view.issuedAt() != null) {
                line(document, "Ngày cấp: " + view.issuedAt().format(DATE), font(regular, 14, DARK), 0, 14);
            }
            line(document, "Mã chứng chỉ: " + view.code(), font(bold, 16, DARK), 0, 6);
            line(document, "Mã này có thể được xác minh công khai trên hệ thống Edumy.", font(regular, 10, GREY), 0, 0);

            document.close();
        } catch (DocumentException | IOException e) {
            throw new IllegalStateException("Không tạo được file PDF chứng chỉ", e);
        }
        return out.toByteArray();
    }

    private static Font font(BaseFont base, float size, Color color) {
        return new Font(base, size, Font.NORMAL, color);
    }

    private static void line(Document document, String text, Font font, float before, float after) throws DocumentException {
        Paragraph paragraph = new Paragraph(text, font);
        paragraph.setAlignment(Element.ALIGN_CENTER);
        paragraph.setSpacingBefore(before);
        paragraph.setSpacingAfter(after);
        document.add(paragraph);
    }

    private static void drawBorder(PdfContentByte canvas, Document document) {
        canvas.setColorStroke(BLUE);
        canvas.setLineWidth(3f);
        canvas.rectangle(20, 20, document.getPageSize().getWidth() - 40, document.getPageSize().getHeight() - 40);
        canvas.stroke();
        canvas.setLineWidth(0.8f);
        canvas.rectangle(30, 30, document.getPageSize().getWidth() - 60, document.getPageSize().getHeight() - 60);
        canvas.stroke();
    }

    private static byte[] load(String path) {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new IllegalStateException("Không đọc được font " + path, e);
        }
    }
}
