package com.edumy.service;

import com.edumy.dto.instructor.ReorderRequest;
import com.edumy.dto.instructor.SectionRequest;
import com.edumy.dto.instructor.SectionResponse;
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
public class InstructorSectionService {

    private final SectionRepository sectionRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;

    @Transactional(readOnly = true)
    public List<SectionResponse> getSectionsByCourse(Long courseId, Long instructorId) {
        verifyCourseOwnership(courseId, instructorId);
        return sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream()
                .map(SectionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SectionResponse createSection(Long courseId, SectionRequest request, Long instructorId) {
        verifyCourseOwnership(courseId, instructorId);

        List<Section> existing = sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        int nextOrderIndex = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getOrderIndex() + 1;

        Section section = Section.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .orderIndex(nextOrderIndex)
                .build();

        Section saved = sectionRepository.save(section);
        log.info("Instructor {} created section {} for course {}", instructorId, saved.getId(), courseId);
        return SectionResponse.fromEntity(saved);
    }

    @Transactional
    public SectionResponse updateSection(Long sectionId, SectionRequest request, Long instructorId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương học với ID: " + sectionId));

        verifyCourseOwnership(section.getCourseId(), instructorId);

        section.setTitle(request.getTitle());
        Section updated = sectionRepository.save(section);
        log.info("Instructor {} updated section {}", instructorId, sectionId);
        return SectionResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteSection(Long sectionId, Long instructorId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương học với ID: " + sectionId));

        verifyCourseOwnership(section.getCourseId(), instructorId);

        List<Lesson> lessons = lessonRepository.findBySectionIdOrderByOrderIndexAsc(sectionId);
        if (!lessons.isEmpty()) {
            lessonRepository.deleteAll(lessons);
        }

        sectionRepository.delete(section);
        log.info("Instructor {} deleted section {}", instructorId, sectionId);
    }

    @Transactional
    public void reorderSections(ReorderRequest request, Long instructorId) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return;
        }

        for (ReorderRequest.ItemOrder item : request.getItems()) {
            Section section = sectionRepository.findById(item.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương học với ID: " + item.getId()));
            verifyCourseOwnership(section.getCourseId(), instructorId);
            section.setOrderIndex(item.getOrderIndex());
            sectionRepository.save(section);
        }
    }

    private void verifyCourseOwnership(Long courseId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + courseId));

        if (instructorId == null || !Objects.equals(course.getInstructorId(), instructorId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác trên khóa học này");
        }
    }
}
