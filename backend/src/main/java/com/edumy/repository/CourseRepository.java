package com.edumy.repository;

import com.edumy.entity.Course;
import com.edumy.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {
    Page<Course> findByStatus(CourseStatus status, Pageable pageable);
    Page<Course> findByCategoryIdAndStatus(Long categoryId, CourseStatus status, Pageable pageable);
    Optional<Course> findByIdAndStatus(Long id, CourseStatus status);
    boolean existsByCategoryId(Long categoryId);
    long countByCategoryId(Long categoryId);
}
