package com.edumy.service;

import com.edumy.dto.learning.ProgressResponse;
import com.edumy.dto.learning.ResumeResponse;
import com.edumy.dto.learning.SaveProgressRequest;
import com.edumy.entity.Enrollment;
import com.edumy.entity.Lesson;
import com.edumy.entity.LessonProgress;
import com.edumy.entity.Section;
import com.edumy.exception.ForbiddenException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * W9-D1 (Issue #73): lưu vị trí xem, tự đánh dấu hoàn thành khi xem ≥ 90%
 * và tính lại progress_percent của enrollment.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LearningProgressService {

    /** Xem từ 90% thời lượng trở lên thì bài học được tính hoàn thành. */
    static final int COMPLETE_THRESHOLD_PERCENT = 90;

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;

    @Transactional
    public ProgressResponse saveProgress(Long userId, Long lessonId, SaveProgressRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        Section section = sectionRepository.findById(lesson.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        Long courseId = section.getCourseId();
        Enrollment enrollment = requireEnrollment(userId, courseId);

        int duration = lesson.getDurationSeconds() == null ? 0 : lesson.getDurationSeconds();
        int position = request.getPositionSec();
        if (duration > 0) {
            position = Math.min(position, duration);
        }

        LessonProgress progress = lessonProgressRepository
                .findByEnrollmentIdAndLessonId(enrollment.getId(), lessonId)
                .orElseGet(() -> LessonProgress.builder().enrollmentId(enrollment.getId()).lessonId(lessonId).build());
        progress.setLastPositionSec(position);

        boolean reachedThreshold = duration > 0 && (long) position * 100 >= (long) duration * COMPLETE_THRESHOLD_PERCENT;
        if (!Boolean.TRUE.equals(progress.getCompleted()) && (Boolean.TRUE.equals(request.getCompleted()) || reachedThreshold)) {
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
        }
        lessonProgressRepository.saveAndFlush(progress);

        Totals totals = recalculate(enrollment, courseId);
        return ProgressResponse.builder()
                .lessonId(lessonId)
                .courseId(courseId)
                .positionSec(progress.getLastPositionSec())
                .completed(progress.getCompleted())
                .progressPercent(enrollment.getProgressPercent())
                .completedLessons(totals.completed())
                .totalLessons(totals.total())
                .courseCompleted(enrollment.getProgressPercent() >= 100)
                .build();
    }

    public ResumeResponse getResume(Long userId, Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + courseId);
        }
        Enrollment enrollment = requireEnrollment(userId, courseId);

        List<Lesson> lessons = lessonsInOrder(courseId);
        Map<Long, LessonProgress> byLesson = lessonProgressRepository.findByEnrollmentId(enrollment.getId()).stream()
                .collect(Collectors.toMap(LessonProgress::getLessonId, p -> p, (a, b) -> a));
        Set<Long> existing = lessons.stream().map(Lesson::getId).collect(Collectors.toSet());

        LessonProgress last = byLesson.values().stream()
                .filter(p -> existing.contains(p.getLessonId()))
                .max(Comparator.comparing(LessonProgress::getUpdatedAt).thenComparing(LessonProgress::getId))
                .orElse(null);

        Long lessonId = last != null ? last.getLessonId() : (lessons.isEmpty() ? null : lessons.get(0).getId());
        List<Long> completedIds = lessons.stream()
                .map(Lesson::getId)
                .filter(id -> byLesson.get(id) != null && Boolean.TRUE.equals(byLesson.get(id).getCompleted()))
                .toList();

        return ResumeResponse.builder()
                .courseId(courseId)
                .lessonId(lessonId)
                .positionSec(last != null ? last.getLastPositionSec() : 0)
                .completed(last != null && Boolean.TRUE.equals(last.getCompleted()))
                .progressPercent(enrollment.getProgressPercent())
                .completedLessons(completedIds.size())
                .totalLessons(lessons.size())
                .completedLessonIds(completedIds)
                .build();
    }

    private Enrollment requireEnrollment(Long userId, Long courseId) {
        return enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ForbiddenException("Bạn cần mua khóa học để lưu tiến độ học"));
    }

    /** Tính lại số bài hoàn thành và progress_percent; đủ 100% thì ghi completed_at một lần. */
    private Totals recalculate(Enrollment enrollment, Long courseId) {
        int total = lessonsInOrder(courseId).size();
        int completed = (int) lessonProgressRepository.countByEnrollmentIdAndCompletedTrue(enrollment.getId());
        int percent = total == 0 ? 0 : Math.min(100, completed * 100 / total);
        enrollment.setProgressPercent(percent);
        if (percent >= 100 && enrollment.getCompletedAt() == null) {
            enrollment.setCompletedAt(LocalDateTime.now());
        }
        enrollmentRepository.save(enrollment);
        return new Totals(completed, total);
    }

    private List<Lesson> lessonsInOrder(Long courseId) {
        return sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId).stream()
                .flatMap(section -> lessonRepository.findBySectionIdOrderByOrderIndexAsc(section.getId()).stream())
                .toList();
    }

    private record Totals(int completed, int total) {}
}
