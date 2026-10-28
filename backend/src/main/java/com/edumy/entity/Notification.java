package com.edumy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "notifications",
    indexes = {
        @Index(name = "idx_notifications_user_id", columnList = "user_id"),
        @Index(name = "idx_notifications_is_read",  columnList = "user_id, is_read")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người nhận thông báo */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Phân loại thông báo — xem {@link NotificationType} */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    /** Tiêu đề ngắn gọn hiển thị trên notification bell */
    @Column(nullable = false, length = 255)
    private String title;

    /** Nội dung chi tiết của thông báo */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /** false = chưa đọc (hiển thị chấm đỏ), true = đã đọc */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
