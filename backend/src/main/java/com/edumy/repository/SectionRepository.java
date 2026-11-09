package com.edumy.repository;

import com.edumy.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByCourseIdOrderByOrderIndexAsc(Long courseId);

    @Query("SELECT COALESCE(MAX(s.orderIndex), 0) FROM Section s WHERE s.courseId = :courseId")
    Integer findMaxOrderIndexByCourseId(@Param("courseId") Long courseId);
}