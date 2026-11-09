package com.edumy.service;

import com.edumy.common.exception.ResourceNotFoundException;
import com.edumy.dto.instructor.ReorderRequest;
import com.edumy.dto.instructor.SectionRequest;
import com.edumy.dto.instructor.SectionResponse;
import com.edumy.entity.Course;
import com.edumy.entity.Section;
import com.edumy.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstructorSectionService {

    private final SectionRepository sectionRepository;
    private final InstructorCourseService courseService;

    public List<SectionResponse> getSectionsByCourse(Long courseId, Long instructorId) {
        courseService.findAndVerifyOwnership(courseId, instructorId);
        return sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SectionResponse createSection(Long courseId, SectionRequest request, Long instructorId) {
        Course course = courseService.findAndVerifyOwnership(courseId, instructorId);
        int nextOrder = sectionRepository.findMaxOrderIndexByCourseId(courseId) + 1;

        Section section = Section.builder()
                .course(course)
                .title(request.getTitle())
                .orderIndex(nextOrder)
                .build();

        return mapToResponse(sectionRepository.save(section));
    }

    @Transactional
    public SectionResponse updateSection(Long sectionId, SectionRequest request, Long instructorId) {
        Section section = getSectionAndVerify(sectionId, instructorId);
        section.setTitle(request.getTitle());
        return mapToResponse(sectionRepository.save(section));
    }

    @Transactional
    public void deleteSection(Long sectionId, Long instructorId) {
        Section section = getSectionAndVerify(sectionId, instructorId);
        sectionRepository.delete(section);
    }

    @Transactional
    public void reorderSections(ReorderRequest request, Long instructorId) {
        for (ReorderRequest.ItemOrder item : request.getItems()) {
            Section section = getSectionAndVerify(item.getId(), instructorId);
            section.setOrderIndex(item.getOrderIndex());
            sectionRepository.save(section);
        }
    }

    public Section getSectionAndVerify(Long sectionId, Long instructorId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương với ID: " + sectionId));
        courseService.findAndVerifyOwnership(section.getCourse().getId(), instructorId);
        return section;
    }

    private SectionResponse mapToResponse(Section s) {
        return SectionResponse.builder()
                .id(s.getId())
                .courseId(s.getCourse().getId())
                .title(s.getTitle())
                .orderIndex(s.getOrderIndex())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}