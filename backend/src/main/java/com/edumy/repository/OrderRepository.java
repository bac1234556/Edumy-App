package com.edumy.repository;

import com.edumy.entity.Order;
import com.edumy.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByTxnRef(String txnRef);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("select sum(o.amount) from Order o where o.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") OrderStatus status);
}
