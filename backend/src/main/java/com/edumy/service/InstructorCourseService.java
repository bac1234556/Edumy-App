package com.edumy.service;

import com.edumy.dto.instructor.CourseCreateRequest;
import com.edumy.dto.instructor.CourseResponse;
import com.edumy.dto.instructor.CourseUpdateRequest;
import com.edumy.entity.Course;
import com.edumy.entity.CourseStatus;
import com.edumy.entity.Section;
import com.edumy.exception.BadRequestException;
import com.edumy.exception.ForbiddenException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstructorCourseService {

    private final CourseRepository courseRepository;

    public List<CourseResponse> getMyCourses(Long instructorId) {
        return courseRepository.findByInstructorIdOrderByCreatedAtDesc(instructorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CourseResponse getCourseById(Long courseId, Long instructorId) {
        Course course = findAndVerifyOwnership(courseId, instructorId);
        return mapToResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseCreateRequest request, Long instructorId) {
        Course course = Course.builder()
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .level(request.getLevel())
                .categoryId(request.getCategoryId())
                .instructorId(instructorId)
                .status(CourseStatus.DRAFT)
                .build();

        return mapToResponse(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse updateCourse(Long courseId, CourseUpdateRequest request, Long instructorId) {
        Course course = findAndVerifyOwnership(courseId, instructorId);

        if (course.getStatus() != CourseStatus.DRAFT) {
            throw new BadRequestException("Khóa học đang chờ duyệt hoặc đã xuất bản không thể chỉnh sửa");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            course.setTitle(request.getTitle());
        }
        if (request.getSubtitle() != null) {
            course.setSubtitle(request.getSubtitle());
        }
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            course.setPrice(request.getPrice());
        }
        if (request.getThumbnailUrl() != null) {
            course.setThumbnailUrl(request.getThumbnailUrl());
        }
        if (request.getLevel() != null) {
            course.setLevel(request.getLevel());
        }
        if (request.getCategoryId() != null) {
            course.setCategoryId(request.getCategoryId());
        }

        return mapToResponse(courseRepository.save(course));
    }

    @Transactional
    public void deleteCourse(Long courseId, Long instructorId) {
        Course course = findAndVerifyOwnership(courseId, instructorId);

        if (course.getStatus() != CourseStatus.DRAFT) {
            throw new BadRequestException("Chỉ được phép xóa khóa học khi đang ở trạng thái DRAFT");
        }

        courseRepository.delete(course);
    }

    @Transactional
    public CourseResponse submitForReview(Long courseId, Long instructorId) {
        Course course = findAndVerifyOwnership(courseId, instructorId);

        if (course.getStatus() != CourseStatus.DRAFT) {
            throw new BadRequestException("Chỉ khóa học ở trạng thái bản nháp (DRAFT) mới có thể gửi phê duyệt");
        }

        List<Section> sections = course.getSections();
        if (sections == null || sections.isEmpty()) {
            throw new BadRequestException("Khóa học phải có ít nhất 1 chương học (Section) trước khi gửi duyệt");
        }

        boolean hasVideoLesson = sections.stream()
                .filter(s -> s.getLessons() != null)
                .flatMap(s -> s.getLessons().stream())
                .anyMatch(l -> l.getVideoUrl() != null && !l.getVideoUrl().trim().isEmpty());

        if (!hasVideoLesson) {
            throw new BadRequestException("Khóa học phải có ít nhất 1 bài học chứa video trước khi gửi duyệt");
        }

        course.setStatus(CourseStatus.PENDING_REVIEW);
        return mapToResponse(courseRepository.save(course));
    }

    public Course findAndVerifyOwnership(Long courseId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + courseId));

        if (!Objects.equals(course.getInstructorId(), instructorId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác trên khóa học này");
        }
        return course;
    }

    private CourseResponse mapToResponse(Course c) {
        return CourseResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .subtitle(c.getSubtitle())
                .description(c.getDescription())
                .price(c.getPrice())
                .thumbnailUrl(c.getThumbnailUrl())
                .level(c.getLevel())
                .status(c.getStatus())
                .rejectReason(c.getRejectReason())
                .categoryId(c.getCategoryId())
                .instructorId(c.getInstructorId())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}