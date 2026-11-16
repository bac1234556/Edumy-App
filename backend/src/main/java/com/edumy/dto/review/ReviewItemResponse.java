package com.edumy.dto.review;

import com.edumy.entity.Review;
import com.edumy.entity.User;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewItemResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userAvatarUrl;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewItemResponse from(Review review, User user) {
        return ReviewItemResponse.builder()
                .id(review.getId())
                .userId(review.getUserId())
                .userName(user != null ? user.getFullName() : "Học viên Edumy")
                .userAvatarUrl(user != null ? user.getAvatarUrl() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
