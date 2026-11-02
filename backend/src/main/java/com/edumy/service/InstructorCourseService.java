package com.edumy.service;

import com.edumy.dto.instructor.CloudinarySignatureResponse;
import com.edumy.dto.instructor.CreateCourseRequest;
import com.edumy.dto.instructor.InstructorCourseResponse;
import com.edumy.dto.instructor.UpdateCourseRequest;
import com.edumy.entity.Course;
import com.edumy.entity.CourseLevel;
import com.edumy.entity.CourseStatus;
import com.edumy.exception.ForbiddenException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CategoryRepository;
import com.edumy.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstructorCourseService {

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;

    @Value("${cloudinary.api-key:dummy_key}")
    private String cloudinaryApiKey;

    @Value("${cloudinary.api-secret:dummy_secret}")
    private String cloudinaryApiSecret;

    @Value("${cloudinary.cloud-name:edumy}")
    private String cloudinaryCloudName;

    @Transactional(readOnly = true)
    public List<InstructorCourseResponse> getCoursesByInstructor(Long instructorId) {
        return courseRepository.findByInstructorId(instructorId).stream()
                .map(InstructorCourseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InstructorCourseResponse getCourseDetail(Long id, Long instructorId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + id));

        validateOwnership(course, instructorId);
        return InstructorCourseResponse.fromEntity(course);
    }

    @Transactional
    public InstructorCourseResponse createCourse(Long instructorId, CreateCourseRequest request) {
        if (!categoryRepository.existsById(request.getCategoryId())) {
            throw new ResourceNotFoundException("Danh mục không tồn tại với ID: " + request.getCategoryId());
        }

        Course course = Course.builder()
                .instructorId(instructorId)
                .categoryId(request.getCategoryId())
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .price(request.getPrice())
                .level(request.getLevel() != null ? request.getLevel() : CourseLevel.ALL_LEVELS)
                .status(CourseStatus.DRAFT)
                .totalDurationSeconds(0)
                .build();

        Course saved = courseRepository.save(course);
        log.info("Instructor {} created course {}", instructorId, saved.getId());
        return InstructorCourseResponse.fromEntity(saved);
    }

    @Transactional
    public InstructorCourseResponse updateCourse(Long id, Long instructorId, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + id));

        validateOwnership(course, instructorId);

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
            if (!categoryRepository.existsById(request.getCategoryId())) {
                throw new ResourceNotFoundException("Danh mục không tồn tại với ID: " + request.getCategoryId());
            }
            course.setCategoryId(request.getCategoryId());
        }
        if (request.getStatus() != null) {
            course.setStatus(request.getStatus());
        }

        Course updated = courseRepository.save(course);
        log.info("Instructor {} updated course {}", instructorId, updated.getId());
        return InstructorCourseResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteCourse(Long id, Long instructorId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + id));

        validateOwnership(course, instructorId);
        courseRepository.delete(course);
        log.info("Instructor {} deleted course {}", instructorId, id);
    }

    public CloudinarySignatureResponse getUploadSignature(Long instructorId, String folder) {
        long timestamp = Instant.now().getEpochSecond();
        String targetFolder = (folder != null && !folder.isBlank()) ? folder : "edumy/courses";
        String toSign = "folder=" + targetFolder + "&timestamp=" + timestamp + cloudinaryApiSecret;

        String signature = sha1Hex(toSign);

        return CloudinarySignatureResponse.builder()
                .signature(signature)
                .timestamp(timestamp)
                .apiKey(cloudinaryApiKey)
                .cloudName(cloudinaryCloudName)
                .folder(targetFolder)
                .build();
    }

    private void validateOwnership(Course course, Long instructorId) {
        if (instructorId == null || !course.getInstructorId().equals(instructorId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác trên khóa học này");
        }
    }

    private String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi sinh chữ ký media", e);
        }
    }
}
