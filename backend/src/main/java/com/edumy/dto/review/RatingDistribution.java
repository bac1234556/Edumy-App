package com.edumy.dto.review;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RatingDistribution {
    @Builder.Default
    private long star5 = 0;
    @Builder.Default
    private long star4 = 0;
    @Builder.Default
    private long star3 = 0;
    @Builder.Default
    private long star2 = 0;
    @Builder.Default
    private long star1 = 0;
}
