package com.edumy.controller;

import com.edumy.entity.*;
import com.edumy.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openpdf.text.pdf.BaseFont;
import org.openpdf.text.pdf.PdfReader;
import org.openpdf.text.pdf.parser.PdfTextExtractor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CertificateControllerTest {

    private static final AtomicLong NEXT = new AtomicLong(1);
    private static final String CODE_PATTERN = "EDUMY-\\d{4}-[A-HJ-NP-Z2-9]{8}";

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private CertificateRepository certificateRepository;

    private Long studentId;
    private Long courseId;
    private Long lessonA;
    private Long textLesson;

    @BeforeEach
    void setUp() {
        long n = NEXT.getAndIncrement();
        User instructor = userRepository.save(User.builder().email("cert.instructor" + n + "@edumy.vn")
                .passwordHash("$2a$10$hashedpassword").fullName("Trần Văn Chuyên")
                .role(Role.INSTRUCTOR).status(UserStatus.ACTIVE).build());
        studentId = userRepository.save(User.builder().email("cert.student" + n + "@edumy.vn")
                .passwordHash("$2a$10$hashedpassword").fullName("Nguyễn Thị Thủy Ngân")
                .role(Role.STUDENT).status(UserStatus.ACTIVE).build()).getId();
        courseId = courseRepository.save(Course.builder().instructorId(instructor.getId()).categoryId(1L)
                .title("Lập trình Java thực chiến").price(new BigDecimal("99000.00"))
                .status(CourseStatus.PUBLISHED).build()).getId();
        Long sectionId = sectionRepository.save(Section.builder().courseId(courseId).title("Chương 1").build()).getId();
        lessonA = lessonRepository.save(Lesson.builder().sectionId(sectionId).title("Bài A").videoUrl("https://cdn/v.mp4")
                .durationSeconds(100).orderIndex(1).build()).getId();
        textLesson = lessonRepository.save(Lesson.builder().sectionId(sectionId).title("Bài đọc")
                .durationSeconds(0).orderIndex(2).build()).getId();
        enrollmentRepository.save(Enrollment.builder().userId(studentId).courseId(courseId).build());
    }

    private RequestPostProcessor as(Long userId) {
        return authentication(new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    private ResultActions save(Long lessonId, String json) throws Exception {
        return mockMvc.perform(put("/api/learn/lessons/" + lessonId + "/progress").with(as(studentId))
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private void finishCourse() throws Exception {
        save(lessonA, "{\"positionSec\":100}").andExpect(status().isOk());
        save(textLesson, "{\"positionSec\":0,\"completed\":true}").andExpect(status().isOk());
    }

    private String certificateCode() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/learn/courses/" + courseId + "/certificate").with(as(studentId)))
                .andExpect(status().isOk()).andReturn();
        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        return com.jayway.jsonpath.JsonPath.read(body, "$.data.code");
    }

    @Test
    @DisplayName("Khi tiến độ đạt 100%, phản hồi lưu tiến độ trả kèm mã chứng chỉ duy nhất")
    void certificateIsIssuedWhenCourseReaches100() throws Exception {
        save(lessonA, "{\"positionSec\":100}")
                .andExpect(jsonPath("$.data.progressPercent").value(50))
                .andExpect(jsonPath("$.data.certificateCode").doesNotExist());
        save(textLesson, "{\"positionSec\":0,\"completed\":true}")
                .andExpect(jsonPath("$.data.progressPercent").value(100))
                .andExpect(jsonPath("$.data.certificateCode", matchesPattern(CODE_PATTERN)));

        Long enrollmentId = enrollmentRepository.findByUserIdAndCourseId(studentId, courseId).orElseThrow().getId();
        assertTrue(certificateRepository.findByEnrollmentId(enrollmentId).isPresent());
    }

    @Test
    @DisplayName("Hoàn thành lại hoặc xem lại không tạo chứng chỉ thứ hai")
    void certificateIsIssuedOnlyOnce() throws Exception {
        finishCourse();
        String first = certificateCode();
        save(lessonA, "{\"positionSec\":5}").andExpect(status().isOk());
        save(textLesson, "{\"positionSec\":0,\"completed\":true}")
                .andExpect(jsonPath("$.data.certificateCode").value(first));
        assertEquals(first, certificateCode());
        assertEquals(1, certificateRepository.findAll().stream()
                .filter(c -> c.getCode().equals(first)).count());
    }

    @Test
    @DisplayName("Chưa hoàn thành khóa thì chưa có chứng chỉ (404), chưa mua thì 403, chưa đăng nhập 401")
    void notEligible() throws Exception {
        save(lessonA, "{\"positionSec\":100}").andExpect(status().isOk());
        mockMvc.perform(get("/api/learn/courses/" + courseId + "/certificate").with(as(studentId)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        Long stranger = userRepository.save(User.builder().email("cert.stranger" + NEXT.getAndIncrement() + "@edumy.vn")
                .passwordHash("x").fullName("Người lạ").role(Role.STUDENT).status(UserStatus.ACTIVE).build()).getId();
        mockMvc.perform(get("/api/learn/courses/" + courseId + "/certificate").with(as(stranger)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/learn/courses/" + courseId + "/certificate"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Chứng chỉ cũ đã đủ 100% nhưng chưa có mã được cấp bù khi mở màn Certificate")
    void legacyCompletedEnrollmentGetsCertificate() throws Exception {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(studentId, courseId).orElseThrow();
        enrollment.setProgressPercent(100);
        enrollmentRepository.save(enrollment);

        mockMvc.perform(get("/api/learn/courses/" + courseId + "/certificate").with(as(studentId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code", matchesPattern(CODE_PATTERN)))
                .andExpect(jsonPath("$.data.studentName").value("Nguyễn Thị Thủy Ngân"))
                .andExpect(jsonPath("$.data.courseTitle").value("Lập trình Java thực chiến"))
                .andExpect(jsonPath("$.data.instructorName").value("Trần Văn Chuyên"))
                .andExpect(jsonPath("$.data.issuedAt").isNotEmpty());
    }

    @Test
    @DisplayName("Verify công khai: không cần đăng nhập, mã hợp lệ trả thông tin, không phân biệt hoa thường")
    void verifyIsPublic() throws Exception {
        finishCourse();
        String code = certificateCode();

        mockMvc.perform(get("/api/certificates/" + code + "/verify"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.valid").value(true))
                .andExpect(jsonPath("$.data.code").value(code))
                .andExpect(jsonPath("$.data.studentName").value("Nguyễn Thị Thủy Ngân"))
                .andExpect(jsonPath("$.data.courseTitle").value("Lập trình Java thực chiến"));
        mockMvc.perform(get("/api/v1/certificates/" + code.toLowerCase() + "/verify"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value(code));
    }

    @Test
    @DisplayName("Verify mã không tồn tại trả 404 đúng format lỗi")
    void verifyUnknownCode() throws Exception {
        mockMvc.perform(get("/api/certificates/EDUMY-2026-ZZZZZZZZ/verify"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Mã chứng chỉ không tồn tại"));
    }

    @Test
    @DisplayName("Hoàn thành khóa là nhận được PDF: đúng định dạng, chứa tên, khóa học, giảng viên và mã")
    void ownerDownloadsPdfWithVietnameseText() throws Exception {
        finishCourse();
        String code = certificateCode();

        MvcResult result = mockMvc.perform(get("/api/certificates/" + code + "/pdf").with(as(studentId)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", containsString("chung-chi-" + code + ".pdf")))
                .andReturn();
        byte[] pdf = result.getResponse().getContentAsByteArray();
        assertTrue(pdf.length > 2_000, "PDF phải có nội dung");
        assertEquals("%PDF", new String(pdf, 0, 4, StandardCharsets.US_ASCII));

        PdfReader reader = new PdfReader(pdf);
        String text = new PdfTextExtractor(reader).getTextFromPage(1);
        reader.close();
        assertTrue(text.contains("CHỨNG CHỈ HOÀN THÀNH"), text);
        assertTrue(text.contains("Nguyễn Thị Thủy Ngân"), text);
        assertTrue(text.contains("Lập trình Java thực chiến"), text);
        assertTrue(text.contains("Trần Văn Chuyên"), text);
        assertTrue(text.contains(code), text);
    }

    @Test
    @DisplayName("Chỉ chủ chứng chỉ tải được PDF: người khác 403, chưa đăng nhập 401, mã sai 404")
    void pdfIsOwnerOnly() throws Exception {
        finishCourse();
        String code = certificateCode();
        Long other = userRepository.save(User.builder().email("cert.other" + NEXT.getAndIncrement() + "@edumy.vn")
                .passwordHash("x").fullName("Người khác").role(Role.STUDENT).status(UserStatus.ACTIVE).build()).getId();

        mockMvc.perform(get("/api/certificates/" + code + "/pdf").with(as(other)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
        mockMvc.perform(get("/api/certificates/" + code + "/pdf")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/certificates/EDUMY-2026-ZZZZZZZZ/pdf").with(as(studentId)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Font nhúng có đủ chữ tiếng Việt có dấu")
    void embeddedFontsCoverVietnamese() throws Exception {
        String sample = "ẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸĐ"
                + "ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđ ơưăâêô";
        for (String file : List.of("fonts/Roboto-Regular.ttf", "fonts/Roboto-Bold.ttf")) {
            byte[] bytes = new ClassPathResource(file).getInputStream().readAllBytes();
            BaseFont font = BaseFont.createFont(file.substring(6), BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, bytes, null);
            Set<Character> missing = new HashSet<>();
            for (char c : sample.toCharArray()) {
                if (!font.charExists(c)) missing.add(c);
            }
            assertTrue(missing.isEmpty(), file + " thiếu glyph: " + missing);
        }
    }

    @Test
    @DisplayName("Mã chứng chỉ sinh ra đúng định dạng và không trùng nhau")
    void generatedCodesAreUniqueAndWellFormed() {
        Set<String> codes = new HashSet<>();
        for (int i = 0; i < 2_000; i++) {
            String code = com.edumy.service.CertificateServiceTestAccess.generate();
            assertTrue(code.matches(CODE_PATTERN), code);
            codes.add(code);
        }
        assertEquals(2_000, codes.size());
    }

    @Test
    @DisplayName("Các endpoint chứng chỉ có trên Swagger")
    void documentedOnSwagger() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/learn/courses/{courseId}/certificate'].get").exists())
                .andExpect(jsonPath("$.paths['/api/certificates/{code}/verify'].get").exists())
                .andExpect(jsonPath("$.paths['/api/certificates/{code}/pdf'].get").exists());
    }
}
