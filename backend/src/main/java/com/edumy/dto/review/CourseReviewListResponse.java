package com.edumy.dto.review;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseReviewListResponse {
    private List<ReviewItemResponse> reviews;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private Double averageRating;
    private Long totalReviews;
    private RatingDistribution distribution;
    private ReviewItemResponse myReview;
}
