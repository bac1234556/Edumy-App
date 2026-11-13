package com.edumy.service;

import com.edumy.dto.review.*;
import com.edumy.entity.Course;
import com.edumy.entity.Review;
import com.edumy.entity.User;
import com.edumy.exception.BadRequestException;
import com.edumy.exception.ForbiddenException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.EnrollmentRepository;
import com.edumy.repository.ReviewRepository;
import com.edumy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public CourseReviewListResponse getCourseReviews(Long courseId, Long currentUserId, Pageable pageable) {
        Course course = findCourseOrThrow(courseId);

        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Review> reviewPage = reviewRepository.findByCourseIdOrderByCreatedAtDesc(courseId, sortedPageable);

        Set<Long> userIds = reviewPage.getContent().stream()
                .map(Review::getUserId)
                .collect(Collectors.toSet());
        if (currentUserId != null) {
            userIds.add(currentUserId);
        }

        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<ReviewItemResponse> items = reviewPage.getContent().stream()
                .map(r -> ReviewItemResponse.from(r, userMap.get(r.getUserId())))
                .collect(Collectors.toList());

        RatingDistribution distribution = new RatingDistribution();
        List<Object[]> grouped = reviewRepository.countRatingsGroupedByStars(courseId);
        for (Object[] row : grouped) {
            int star = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            switch (star) {
                case 5 -> distribution.setStar5(count);
                case 4 -> distribution.setStar4(count);
                case 3 -> distribution.setStar3(count);
                case 2 -> distribution.setStar2(count);
                case 1 -> distribution.setStar1(count);
            }
        }

        Double avg = reviewRepository.calculateAverageRatingByCourseId(courseId);
        Long totalReviews = reviewRepository.countByCourseId(courseId);
        double roundedAvg = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;

        ReviewItemResponse myReview = null;
        if (currentUserId != null) {
            Optional<Review> own = reviewRepository.findByUserIdAndCourseId(currentUserId, courseId);
            if (own.isPresent()) {
                myReview = ReviewItemResponse.from(own.get(), userMap.get(currentUserId));
            }
        }

        return CourseReviewListResponse.builder()
                .reviews(items)
                .page(reviewPage.getNumber())
                .size(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .averageRating(roundedAvg)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .distribution(distribution)
                .myReview(myReview)
                .build();
    }

    @Transactional
    public ReviewItemResponse createReview(Long courseId, Long userId, ReviewRequest request) {
        Course course = findCourseOrThrow(courseId);

        if (!enrollmentRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new ForbiddenException("Chỉ học viên đã mua khóa học mới có thể viết đánh giá");
        }

        if (reviewRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new BadRequestException("Bạn đã đánh giá khóa học này rồi");
        }

        Review review = Review.builder()
                .courseId(courseId)
                .userId(userId)
                .rating(request.getRating())
                .comment(request.getComment() != null ? request.getComment().trim() : null)
                .build();

        Review saved = reviewRepository.save(review);
        updateCourseRatingMetrics(course);

        User user = userRepository.findById(userId).orElse(null);
        log.info("User {} created review for course {} with rating {}", userId, courseId, request.getRating());
        return ReviewItemResponse.from(saved, user);
    }

    @Transactional
    public ReviewItemResponse updateReview(Long courseId, Long userId, ReviewRequest request) {
        Course course = findCourseOrThrow(courseId);

        Review review = reviewRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá của bạn cho khóa học này"));

        review.setRating(request.getRating());
        if (request.getComment() != null) {
            review.setComment(request.getComment().trim());
        }

        Review updated = reviewRepository.save(review);
        updateCourseRatingMetrics(course);

        User user = userRepository.findById(userId).orElse(null);
        log.info("User {} updated review for course {}", userId, courseId);
        return ReviewItemResponse.from(updated, user);
    }

    @Transactional
    public void deleteReview(Long courseId, Long userId) {
        Course course = findCourseOrThrow(courseId);

        Review review = reviewRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá của bạn cho khóa học này"));

        reviewRepository.delete(review);
        updateCourseRatingMetrics(course);
        log.info("User {} deleted review for course {}", userId, courseId);
    }

    private Course findCourseOrThrow(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học với ID: " + courseId));
    }

    private void updateCourseRatingMetrics(Course course) {
        Double avg = reviewRepository.calculateAverageRatingByCourseId(course.getId());
        Long count = reviewRepository.countByCourseId(course.getId());

        double roundedAvg = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
        int ratingCount = count != null ? count.intValue() : 0;

        course.setAvgRating(roundedAvg);
        course.setRatingCount(ratingCount);
        courseRepository.save(course);
    }
}
