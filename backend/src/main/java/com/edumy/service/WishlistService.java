package com.edumy.service;

import com.edumy.dto.course.CourseSummaryResponse;
import com.edumy.entity.Category;
import com.edumy.entity.Course;
import com.edumy.entity.CourseStatus;
import com.edumy.entity.Wishlist;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CategoryRepository;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.ReviewRepository;
import com.edumy.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> getMyWishlist(Long userId) {
        List<Wishlist> wishlists = wishlistRepository.findByUserId(userId);
        if (wishlists.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> courseIds = wishlists.stream()
                .map(Wishlist::getCourseId)
                .collect(Collectors.toList());

        List<Course> courses = courseRepository.findAllById(courseIds);
        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (c1, c2) -> c1));

        return courses.stream()
                .filter(c -> c.getStatus() == CourseStatus.PUBLISHED)
                .map(course -> {
                    Category cat = categoryMap.get(course.getCategoryId());
                    Double avg = course.getAvgRating() != null && course.getAvgRating() > 0
                            ? course.getAvgRating()
                            : reviewRepository.calculateAverageRatingByCourseId(course.getId());
                    Long total = course.getRatingCount() != null && course.getRatingCount() > 0
                            ? course.getRatingCount().longValue()
                            : reviewRepository.countByCourseId(course.getId());

                    return CourseSummaryResponse.builder()
                            .id(course.getId())
                            .title(course.getTitle())
                            .subtitle(course.getSubtitle())
                            .thumbnailUrl(course.getThumbnailUrl())
                            .price(course.getPrice())
                            .level(course.getLevel())
                            .instructorId(course.getInstructorId())
                            .instructorName("Giảng viên Edumy")
                            .categoryId(course.getCategoryId())
                            .categoryName(cat != null ? cat.getName() : "Khóa học")
                            .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 5.0)
                            .totalReviews(total != null ? total : 0L)
                            .totalDurationSeconds(course.getTotalDurationSeconds())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Long> getMyWishlistCourseIds(Long userId) {
        return wishlistRepository.findByUserId(userId).stream()
                .map(Wishlist::getCourseId)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> addToWishlist(Long userId, Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + courseId);
        }

        // Idempotent: nếu đã có trong wishlist thì không tạo thêm
        if (!wishlistRepository.existsByUserIdAndCourseId(userId, courseId)) {
            Wishlist wishlist = Wishlist.builder()
                    .userId(userId)
                    .courseId(courseId)
                    .build();
            wishlistRepository.save(wishlist);
            log.info("User {} added course {} to wishlist", userId, courseId);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("courseId", courseId);
        result.put("wishlisted", true);
        return result;
    }

    @Transactional
    public Map<String, Object> removeFromWishlist(Long userId, Long courseId) {
        wishlistRepository.deleteByUserIdAndCourseId(userId, courseId);
        log.info("User {} removed course {} from wishlist", userId, courseId);

        Map<String, Object> result = new HashMap<>();
        result.put("courseId", courseId);
        result.put("wishlisted", false);
        return result;
    }
}
