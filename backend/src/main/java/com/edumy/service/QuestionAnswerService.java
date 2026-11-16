package com.edumy.service;

import com.edumy.common.PageResponse;
import com.edumy.dto.qa.AnswerResponse;
import com.edumy.dto.qa.QuestionRequest;
import com.edumy.dto.qa.QuestionResponse;
import com.edumy.entity.*;
import com.edumy.exception.ForbiddenException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuestionAnswerService {

    @PersistenceContext
    private EntityManager entityManager;

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final LessonRepository lessonRepository;
    private final SectionRepository sectionRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;

    @Transactional
    public QuestionResponse createQuestion(Long lessonId, Long userId, QuestionRequest request) {
        LessonCourse lessonCourse = findLessonCourse(lessonId);
        if (!enrollmentRepository.existsByUserIdAndCourseId(userId, lessonCourse.course().getId())) {
            throw new ForbiddenException("Bạn cần ghi danh khóa học để đặt câu hỏi");
        }

        String content = request.getContent().trim();
        String title = request.getTitle();
        if (title == null || title.isBlank()) {
            title = content.lines().findFirst().orElse(content);
            if (title.length() > 255) {
                title = title.substring(0, 255);
            }
        } else {
            title = title.trim();
        }

        Question question = questionRepository.save(Question.builder()
                .lessonId(lessonId)
                .userId(userId)
                .title(title)
                .content(content)
                .build());

        Long instructorId = lessonCourse.course().getInstructorId();
        if (!instructorId.equals(userId)) {
            notificationService.createNotification(instructorId, NotificationType.NEW_QUESTION,
                    "Câu hỏi mới trong khóa học",
                    "Có câu hỏi mới trong khóa học " + lessonCourse.course().getTitle(),
                    question.getId());
        }

        return QuestionResponse.from(question, List.of());
    }

    @Transactional(readOnly = true)
    public PageResponse<QuestionResponse> getLessonQuestions(Long lessonId, Long userId, Pageable pageable) {
        LessonCourse lessonCourse = findLessonCourse(lessonId);
        ensureCanAccessCourse(userId, lessonCourse.course());

        Page<Question> questions = questionRepository.findByLessonIdOrderByCreatedAtDesc(lessonId, pageable);
        List<Long> questionIds = questions.getContent().stream().map(Question::getId).toList();
        Map<Long, List<AnswerResponse>> answersByQuestion = new HashMap<>();
        if (!questionIds.isEmpty()) {
            for (Answer answer : answerRepository.findAnswersForQuestions(questionIds)) {
                answersByQuestion.computeIfAbsent(answer.getQuestionId(), ignored -> new ArrayList<>())
                        .add(AnswerResponse.from(answer));
            }
        }
        return PageResponse.from(questions.map(question ->
                QuestionResponse.from(question, answersByQuestion.getOrDefault(question.getId(), List.of()))));
    }

    @Transactional
    public AnswerResponse createAnswer(Long questionId, Long userId, String content) {
        Question question = findQuestion(questionId);
        LessonCourse lessonCourse = findLessonCourse(question.getLessonId());
        ensureCanAnswer(userId, lessonCourse.course());

        Answer answer = answerRepository.save(Answer.builder()
                .questionId(questionId)
                .userId(userId)
                .content(content.trim())
                .isAccepted(false)
                .build());

        if (!question.getUserId().equals(userId)) {
            notificationService.createNotification(question.getUserId(), NotificationType.NEW_ANSWER,
                    "Câu hỏi của bạn có câu trả lời mới",
                    "Có câu trả lời mới cho câu hỏi: " + question.getTitle(),
                    question.getId());
        }
        return AnswerResponse.from(answer);
    }

    @Transactional
    public AnswerResponse acceptAnswer(Long answerId, Long userId) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu trả lời với ID: " + answerId));
        Question question = questionRepository.findLockedById(answer.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với ID: " + answer.getQuestionId()));
        LessonCourse lessonCourse = findLessonCourse(question.getLessonId());
        if (!lessonCourse.course().getInstructorId().equals(userId) && !question.getUserId().equals(userId)) {
            throw new ForbiddenException("Chỉ giảng viên của khóa học hoặc người đặt câu hỏi mới được chấp nhận câu trả lời");
        }

        entityManager.refresh(answer, LockModeType.PESSIMISTIC_WRITE);
        List<Answer> answers = answerRepository.findLockedByQuestionId(question.getId());
        boolean alreadyAccepted = answers.stream()
                .filter(current -> Boolean.TRUE.equals(current.getIsAccepted()))
                .map(Answer::getId)
                .toList()
                .equals(List.of(answerId));
        if (alreadyAccepted) {
            return AnswerResponse.from(answer);
        }
        for (Answer current : answers) {
            current.setIsAccepted(current.getId().equals(answerId));
        }
        answerRepository.saveAll(answers);
        answer.setIsAccepted(true);
        return AnswerResponse.from(answer);
    }

    private Question findQuestion(Long questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với ID: " + questionId));
    }

    private LessonCourse findLessonCourse(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        Section section = sectionRepository.findById(lesson.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương của bài học"));
        Course course = courseRepository.findById(section.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học của bài học"));
        return new LessonCourse(lesson, course);
    }

    private void ensureCanAccessCourse(Long userId, Course course) {
        if (!course.getInstructorId().equals(userId)
                && !enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId())) {
            throw new ForbiddenException("Bạn không có quyền truy cập nội dung khóa học này");
        }
    }

    private void ensureCanAnswer(Long userId, Course course) {
        ensureCanAccessCourse(userId, course);
    }

    private record LessonCourse(Lesson lesson, Course course) {
    }
}
