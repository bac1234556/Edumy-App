package com.edumy.repository;

import com.edumy.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findBySectionIdOrderByOrderIndexAsc(Long sectionId);
    List<Lesson> findBySectionIdInOrderByOrderIndexAsc(List<Long> sectionIds);
}
