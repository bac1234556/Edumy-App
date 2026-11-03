package com.edumy.repository;

import com.edumy.entity.Course;
import com.edumy.entity.CourseLevel;
import com.edumy.entity.CourseStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CourseSpecification {

    public static Specification<Course> filterCourses(
            String keyword,
            Long categoryId,
            Boolean isFree,
            CourseLevel level
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Luôn lọc khóa học có trạng thái PUBLISHED cho public catalog
            predicates.add(cb.equal(root.get("status"), CourseStatus.PUBLISHED));

            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate subtitleMatch = cb.like(cb.lower(root.get("subtitle")), pattern);
                predicates.add(cb.or(titleMatch, subtitleMatch));
            }

            if (categoryId != null && categoryId > 0) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }

            if (isFree != null) {
                if (Boolean.TRUE.equals(isFree)) {
                    predicates.add(cb.equal(root.get("price"), BigDecimal.ZERO));
                } else {
                    predicates.add(cb.greaterThan(root.get("price"), BigDecimal.ZERO));
                }
            }

            if (level != null) {
                predicates.add(cb.equal(root.get("level"), level));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
