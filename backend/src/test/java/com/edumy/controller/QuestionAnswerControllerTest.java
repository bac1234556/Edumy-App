package com.edumy.controller;

import com.edumy.entity.*;
import com.edumy.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class QuestionAnswerControllerTest {

    private static final AtomicLong NEXT_ID = new AtomicLong(1_200_000);

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private AnswerRepository answerRepository;
    @Autowired private NotificationRepository notificationRepository;

    private User instructor;
    private User otherInstructor;
    private User student;
    private User outsider;
    private Course course;
    private Long lessonId;

    @BeforeEach
    void setUp() {
        instructor = user(Role.INSTRUCTOR);
        otherInstructor = user(Role.INSTRUCTOR);
        student = user(Role.STUDENT);
        outsider = user(Role.STUDENT);
        course = courseRepository.save(Course.builder()
                .instructorId(instructor.getId())
                .categoryId(1L)
                .title("Khóa học Q&A")
                .status(CourseStatus.PUBLISHED)
                .build());
        Section section = sectionRepository.save(Section.builder()
                .courseId(course.getId()).title("Chương 1").build());
        lessonId = lessonRepository.save(Lesson.builder()
                .sectionId(section.getId()).title("Bài học 1").build()).getId();
        enrollmentRepository.save(Enrollment.builder().userId(student.getId()).courseId(course.getId()).build());
    }

    private User user(Role role) {
        long id = NEXT_ID.incrementAndGet();
        return userRepository.save(User.builder()
                .email("qa-" + id + "@edumy.test")
                .passwordHash("$2a$10$hashedpassword")
                .fullName("Q&A test user")
                .role(role)
                .status(UserStatus.ACTIVE)
                .build());
    }

    private RequestPostProcessor as(User user) {
        return authentication(new UsernamePasswordAuthenticationToken(
                user.getId(), null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))));
    }

    private String questionPayload(String title, String content) throws Exception {
        return objectMapper.writeValueAsString(java.util.Map.of("title", title, "content", content));
    }

    private String questionPayload(String content) throws Exception {
        return objectMapper.writeValueAsString(java.util.Map.of("content", content));
    }

    private String answerPayload(String content) throws Exception {
        return objectMapper.writeValueAsString(java.util.Map.of("content", content));
    }

    private Long createQuestion() throws Exception {
        String result = mockMvc.perform(post("/api/lessons/{id}/questions", lessonId)
                        .with(as(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(questionPayload("Câu hỏi kiểm thử")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(result).path("data").path("id").asLong();
    }

    private Long createAnswer(Long questionId, User author, String content) throws Exception {
        String result = mockMvc.perform(post("/api/questions/{id}/answers", questionId)
                        .with(as(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerPayload(content)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(result).path("data").path("id").asLong();
    }

    @Test
    @DisplayName("Học viên đã ghi danh đặt câu hỏi và notification gửi đúng giảng viên")
    void enrolledStudentCanAskAndNotifiesInstructor() throws Exception {
        mockMvc.perform(post("/api/lessons/{id}/questions", lessonId)
                        .with(as(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(questionPayload("Tiêu đề", "  Câu hỏi về bài học  ")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Tiêu đề"))
                .andExpect(jsonPath("$.data.content").value("Câu hỏi về bài học"))
                .andExpect(jsonPath("$.data.authorId").value(student.getId()));

        List<Notification> instructorNotifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(instructor.getId(),
                        org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        assertEquals(1, instructorNotifications.size());
        assertEquals(NotificationType.NEW_QUESTION, instructorNotifications.get(0).getType());
        assertEquals(questionRepository.findAll().get(0).getId(), instructorNotifications.get(0).getReferenceId());
        assertEquals(0, notificationRepository.findByUserIdOrderByCreatedAtDesc(student.getId(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getTotalElements());

        enrollmentRepository.save(Enrollment.builder().userId(instructor.getId()).courseId(course.getId()).build());
        mockMvc.perform(post("/api/lessons/{id}/questions", lessonId)
                        .with(as(instructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(questionPayload("Câu hỏi của giảng viên")))
                .andExpect(status().isCreated());
        assertEquals(1, notificationRepository.findByUserIdOrderByCreatedAtDesc(instructor.getId(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getTotalElements());
    }

    @Test
    @DisplayName("Người ngoài khóa không được hỏi, xem câu hỏi hoặc trả lời")
    void outsidersAreForbiddenFromQuestionsAndAnswers() throws Exception {
        Long questionId = createQuestion();
        mockMvc.perform(post("/api/lessons/{id}/questions", lessonId)
                        .with(as(outsider))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(questionPayload("Không có quyền")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(jsonPath("$.message").isNotEmpty());

        mockMvc.perform(get("/api/lessons/{id}/questions", lessonId).with(as(outsider)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/api/questions/{id}/answers", questionId)
                        .with(as(outsider))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerPayload("Trả lời trái phép")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Chỉ học viên ghi danh hoặc đúng giảng viên mới trả lời; notification bỏ qua chính tác giả")
    void answersAreAuthorizedAndNotificationsTargetQuestionAuthor() throws Exception {
        Long questionId = createQuestion();

        mockMvc.perform(post("/api/questions/{id}/answers", questionId)
                        .with(as(otherInstructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerPayload("Giảng viên khóa khác")))
                .andExpect(status().isForbidden());

        createAnswer(questionId, instructor, "Câu trả lời từ giảng viên");
        List<Notification> studentNotifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(student.getId(),
                        org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        assertEquals(1, studentNotifications.size());
        assertEquals(NotificationType.NEW_ANSWER, studentNotifications.get(0).getType());
        assertEquals(questionId, studentNotifications.get(0).getReferenceId());

        createAnswer(questionId, student, "Tự trả lời câu hỏi");
        assertEquals(1, notificationRepository.findByUserIdOrderByCreatedAtDesc(student.getId(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getTotalElements());

        mockMvc.perform(get("/api/lessons/{id}/questions", lessonId).with(as(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].answerCount").value(2))
                .andExpect(jsonPath("$.data.content[0].hasAcceptedAnswer").value(false))
                .andExpect(jsonPath("$.data.content[0].answers", org.hamcrest.Matchers.hasSize(2)));
    }

    @Test
    @DisplayName("Người hỏi hoặc giảng viên có thể accept; chỉ một câu trả lời được accepted")
    void acceptAuthorizationAndSingleAcceptedAnswer() throws Exception {
        Long questionId = createQuestion();
        Long firstAnswerId = createAnswer(questionId, instructor, "Câu trả lời 1");
        Long secondAnswerId = createAnswer(questionId, student, "Câu trả lời 2");
        User anotherStudent = user(Role.STUDENT);
        enrollmentRepository.save(Enrollment.builder().userId(anotherStudent.getId()).courseId(course.getId()).build());

        mockMvc.perform(patch("/api/answers/{id}/accept", firstAnswerId).with(as(anotherStudent)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(patch("/api/answers/{id}/accept", firstAnswerId).with(as(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accepted").value(true));
        mockMvc.perform(patch("/api/answers/{id}/accept", firstAnswerId).with(as(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accepted").value(true));
        mockMvc.perform(patch("/api/answers/{id}/accept", secondAnswerId).with(as(instructor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accepted").value(true));

        assertEquals(1, answerRepository.findByQuestionIdOrderByIsAcceptedDescCreatedAtAsc(questionId)
                .stream().filter(answer -> Boolean.TRUE.equals(answer.getIsAccepted())).count());
        assertEquals(secondAnswerId, answerRepository.findByQuestionIdOrderByIsAcceptedDescCreatedAtAsc(questionId)
                .stream().filter(answer -> Boolean.TRUE.equals(answer.getIsAccepted()))
                .findFirst().orElseThrow().getId());
    }

    @Test
    @DisplayName("Input lỗi trả 400; ID không tồn tại trả 404")
    void validationAndMissingResourcesUseApiErrorFormat() throws Exception {
        mockMvc.perform(post("/api/lessons/{id}/questions", lessonId)
                        .with(as(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(questionPayload("   ")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(jsonPath("$.errors[*].field", org.hamcrest.Matchers.hasItem("content")));

        mockMvc.perform(post("/api/questions/{id}/answers", 9_999_999L)
                        .with(as(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerPayload("Nội dung")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").isNotEmpty());

        mockMvc.perform(patch("/api/answers/{id}/accept", 9_999_999L).with(as(student)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/lessons/{id}/questions", 9_999_999L).with(as(student)))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/lessons/{id}/questions", 9_999_999L)
                        .with(as(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(questionPayload("Bài học không tồn tại")))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/lessons/{id}/questions'].post").exists())
                .andExpect(jsonPath("$.paths['/api/lessons/{id}/questions'].get").exists())
                .andExpect(jsonPath("$.paths['/api/questions/{id}/answers'].post").exists())
                .andExpect(jsonPath("$.paths['/api/answers/{id}/accept'].patch").exists())
                .andExpect(jsonPath("$.paths['/api/v1/lessons/{id}/questions'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/questions/{id}/answers'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/answers/{id}/accept'].patch").exists());
    }
}
