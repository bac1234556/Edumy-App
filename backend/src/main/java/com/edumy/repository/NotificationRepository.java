package com.edumy.repository;

import com.edumy.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Lấy danh sách thông báo của user (mới nhất trước), hỗ trợ phân trang */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Đếm số thông báo chưa đọc — dùng hiển thị badge đỏ trên notification bell */
    long countByUserIdAndIsReadFalse(Long userId);

    /** Đánh dấu toàn bộ thông báo của user là đã đọc */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);
}
