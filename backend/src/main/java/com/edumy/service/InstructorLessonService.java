package com.edumy.service;

import com.edumy.common.exception.ResourceNotFoundException;
import com.edumy.dto.instructor.LessonRequest;
import com.edumy.dto.instructor.LessonResponse;
import com.edumy.dto.instructor.ReorderRequest;
import com.edumy.entity.Lesson;
import com.edumy.entity.Section;
import com.edumy.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstructorLessonService {

    private final LessonRepository lessonRepository;
    private final InstructorSectionService sectionService;

    public List<LessonResponse> getLessonsBySection(Long sectionId, Long instructorId) {
        sectionService.getSectionAndVerify(sectionId, instructorId);
        return lessonRepository.findBySectionIdOrderByOrderIndexAsc(sectionId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LessonResponse createLesson(Long sectionId, LessonRequest request, Long instructorId) {
        Section section = sectionService.getSectionAndVerify(sectionId, instructorId);
        int nextOrder = lessonRepository.findMaxOrderIndexBySectionId(sectionId) + 1;

        Lesson lesson = Lesson.builder()
                .section(section)
                .title(request.getTitle())
                .type(request.getType())
                .videoUrl(request.getVideoUrl())
                .publicId(request.getPublicId())
                .durationSec(request.getDurationSec() != null ? request.getDurationSec() : 0)
                .isPreview(request.getIsPreview() != null ? request.getIsPreview() : false)
                .orderIndex(nextOrder)
                .build();

        return mapToResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public LessonResponse updateLesson(Long lessonId, LessonRequest request, Long instructorId) {
        Lesson lesson = getLessonAndVerify(lessonId, instructorId);

        lesson.setTitle(request.getTitle());
        lesson.setType(request.getType());
        if (request.getVideoUrl() != null) lesson.setVideoUrl(request.getVideoUrl());
        if (request.getPublicId() != null) lesson.setPublicId(request.getPublicId());
        if (request.getDurationSec() != null) lesson.setDurationSec(request.getDurationSec());
        if (request.getIsPreview() != null) lesson.setIsPreview(request.getIsPreview());

        return mapToResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public void deleteLesson(Long lessonId, Long instructorId) {
        Lesson lesson = getLessonAndVerify(lessonId, instructorId);
        lessonRepository.delete(lesson);
    }

    @Transactional
    public void reorderLessons(ReorderRequest request, Long instructorId) {
        for (ReorderRequest.ItemOrder item : request.getItems()) {
            Lesson lesson = getLessonAndVerify(item.getId(), instructorId);
            lesson.setOrderIndex(item.getOrderIndex());
            lessonRepository.save(lesson);
        }
    }

    private Lesson getLessonAndVerify(Long lessonId, Long instructorId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học với ID: " + lessonId));
        sectionService.getSectionAndVerify(lesson.getSection().getId(), instructorId);
        return lesson;
    }

    private LessonResponse mapToResponse(Lesson l) {
        return LessonResponse.builder()
                .id(l.getId())
                .sectionId(l.getSection().getId())
                .title(l.getTitle())
                .type(l.getType())
                .videoUrl(l.getVideoUrl())
                .publicId(l.getPublicId())
                .durationSec(l.getDurationSec())
                .isPreview(l.getIsPreview())
                .orderIndex(l.getOrderIndex())
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .build();
    }
}