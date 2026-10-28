package com.edumy.entity;

/**
 * Các loại thông báo in-app của hệ thống Edumy.
 */
public enum NotificationType {

    /** Khóa học của giảng viên vừa được Admin phê duyệt và xuất bản */
    COURSE_APPROVED,

    /** Khóa học của giảng viên bị Admin từ chối, kèm lý do */
    COURSE_REJECTED,

    /** Có câu trả lời mới cho câu hỏi của học viên */
    NEW_ANSWER,

    /** Có học viên mới ghi danh vào khóa học của giảng viên */
    NEW_ENROLLMENT
}
