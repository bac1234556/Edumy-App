package com.edumy.service;

import com.edumy.dto.instructor.LessonRequest;
import com.edumy.dto.instructor.LessonResponse;
import com.edumy.dto.instructor.ReorderRequest;
import com.edumy.entity.Course;
import com.edumy.entity.Lesson;
import com.edumy.entity.Section;
import com.edumy.exception.ForbiddenException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.LessonRepository;
import com.edumy.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstructorLessonService {

    private final LessonRepository lessonRepository;
    private final SectionRepository sectionRepository;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsBySection(Long sectionId, Long instructorId) {
        verifySectionOwnership(sectionId, instructorId);
        return lessonRepository.findBySectionIdOrderByOrderIndexAsc(sectionId)
                .stream()
                .map(LessonResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public LessonResponse createLesson(Long sectionId, LessonRequest request, Long instructorId) {
        verifySectionOwnership(sectionId, instructorId);

        List<Lesson> existing = lessonRepository.findBySectionIdOrderByOrderIndexAsc(sectionId);
        int nextOrderIndex = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getOrderIndex() + 1;

        Lesson lesson = Lesson.builder()
                .sectionId(sectionId)
                .title(request.getTitle())
                .videoUrl(request.getVideoUrl())
                .videoPublicId(request.getPublicId())
                .durationSeconds(request.getDurationSec() != null ? request.getDurationSec() : 0)
                .isPreview(Boolean.TRUE.equals(request.getIsPreview()))
                .orderIndex(nextOrderIndex)
                .build();

        Lesson saved = lessonRepository.save(lesson);
        log.info("Instructor {} created lesson {} in section {}", instructorId, saved.getId(), sectionId);
        return LessonResponse.fromEntity(saved);
    }

    @Transactional
    public LessonResponse updateLesson(Long lessonId, LessonRequest request, Long instructorId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học với ID: " + lessonId));

        verifySectionOwnership(lesson.getSectionId(), instructorId);

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            lesson.setTitle(request.getTitle());
        }
        if (request.getVideoUrl() != null) {
            lesson.setVideoUrl(request.getVideoUrl());
        }
        if (request.getPublicId() != null) {
            lesson.setVideoPublicId(request.getPublicId());
        }
        if (request.getDurationSec() != null) {
            lesson.setDurationSeconds(request.getDurationSec());
        }
        if (request.getIsPreview() != null) {
            lesson.setIsPreview(request.getIsPreview());
        }

        Lesson updated = lessonRepository.save(lesson);
        log.info("Instructor {} updated lesson {}", instructorId, lessonId);
        return LessonResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteLesson(Long lessonId, Long instructorId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học với ID: " + lessonId));

        verifySectionOwnership(lesson.getSectionId(), instructorId);
        lessonRepository.delete(lesson);
        log.info("Instructor {} deleted lesson {}", instructorId, lessonId);
    }

    @Transactional
    public void reorderLessons(ReorderRequest request, Long instructorId) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return;
        }

        for (ReorderRequest.ItemOrder item : request.getItems()) {
            Lesson lesson = lessonRepository.findById(item.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học với ID: " + item.getId()));
            verifySectionOwnership(lesson.getSectionId(), instructorId);
            lesson.setOrderIndex(item.getOrderIndex());
            lessonRepository.save(lesson);
        }
    }

    private void verifySectionOwnership(Long sectionId, Long instructorId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương học với ID: " + sectionId));

        Course course = courseRepository.findById(section.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + section.getCourseId()));

        if (instructorId == null || !Objects.equals(course.getInstructorId(), instructorId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác trên bài học này");
        }
    }
}
