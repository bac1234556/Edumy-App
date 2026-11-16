package com.edumy.repository;

import com.edumy.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByTxnRef(String txnRef);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT SUM(o.amount) FROM Order o " +
            "WHERE o.status = com.edumy.entity.OrderStatus.PAID " +
            "AND o.courseId IN (SELECT c.id FROM Course c WHERE c.instructorId = :instructorId)")
    BigDecimal sumPaidAmountByInstructorId(@Param("instructorId") Long instructorId);

    @Query("SELECT SUM(o.amount) FROM Order o " +
            "WHERE o.status = com.edumy.entity.OrderStatus.PAID AND o.courseId = :courseId")
    BigDecimal sumPaidAmountByCourseId(@Param("courseId") Long courseId);
}
