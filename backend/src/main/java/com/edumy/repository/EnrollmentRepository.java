package com.edumy.repository;

import com.edumy.entity.Enrollment;
// <<<<<<< feature/70-instructor-stats-api
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;
// =======
// import org.springframework.data.jpa.repository.JpaRepository;
// >>>>>>> develop
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);
// <<<<<<< feature/70-instructor-stats-api

//     Page<Enrollment> findByCourseIdOrderByCreatedAtDesc(Long courseId, Pageable pageable);

//     @Query("SELECT COUNT(DISTINCT e.userId) FROM Enrollment e " +
//             "WHERE e.courseId IN (SELECT c.id FROM Course c WHERE c.instructorId = :instructorId)")
//     long countDistinctStudentsByInstructorId(@Param("instructorId") Long instructorId);
// =======
// >>>>>>> develop
}
