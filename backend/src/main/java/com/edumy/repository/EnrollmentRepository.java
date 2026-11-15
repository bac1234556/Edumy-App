package com.edumy.repository;

import com.edumy.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    @Query("select year(e.createdAt) as yearNumber, month(e.createdAt) as monthNumber, count(e.id) as count " +
            "from Enrollment e where e.createdAt >= :from and e.createdAt < :to " +
            "group by year(e.createdAt), month(e.createdAt) " +
            "order by year(e.createdAt), month(e.createdAt)")
    List<EnrollmentMonthlyProjection> countByMonthBetween(
            @Param("from") java.time.LocalDateTime from,
            @Param("to") java.time.LocalDateTime to);
}
