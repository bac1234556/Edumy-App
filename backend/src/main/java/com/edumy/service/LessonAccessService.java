package com.edumy.service;

import com.edumy.dto.learning.LessonPlaybackResponse;
import com.edumy.entity.Lesson;
import com.edumy.entity.Section;
import com.edumy.exception.ForbiddenException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.EnrollmentRepository;
import com.edumy.repository.LessonRepository;
import com.edumy.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * W8-D3 (Issue #46): chỉ học viên đã ghi danh mới lấy được link video của bài thường.
 * Bài xem trước (is_preview) mở cho mọi người dùng đã đăng nhập, khớp quy tắc của Course Detail.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonAccessService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;

    public LessonPlaybackResponse getLesson(Long userId, Long courseId, Long lessonId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + courseId);
        }
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        Section section = sectionRepository.findById(lesson.getSectionId())
                .filter(s -> courseId.equals(s.getCourseId()))
                .orElseThrow(() -> new ResourceNotFoundException("Bài học không thuộc khóa học này"));

        boolean preview = Boolean.TRUE.equals(lesson.getIsPreview());
        if (!preview && !enrollmentRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new ForbiddenException("Bạn cần mua khóa học để xem bài học này");
        }

        return LessonPlaybackResponse.builder()
                .id(lesson.getId())
                .courseId(courseId)
                .sectionId(section.getId())
                .title(lesson.getTitle())
                .videoUrl(lesson.getVideoUrl())
                .durationSeconds(lesson.getDurationSeconds())
                .isPreview(preview)
                .orderIndex(lesson.getOrderIndex())
                .build();
    }
}
