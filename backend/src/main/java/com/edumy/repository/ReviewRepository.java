package com.edumy.repository;

import com.edumy.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByCourseId(Long courseId, Pageable pageable);
    Page<Review> findByCourseIdOrderByCreatedAtDesc(Long courseId, Pageable pageable);
    Optional<Review> findByUserIdAndCourseId(Long userId, Long courseId);
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.courseId = :courseId")
    Double calculateAverageRatingByCourseId(@Param("courseId") Long courseId);

    Long countByCourseId(Long courseId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.courseId = :courseId GROUP BY r.rating")
    List<Object[]> countRatingsGroupedByStars(@Param("courseId") Long courseId);

    void deleteByUserIdAndCourseId(Long userId, Long courseId);
}
