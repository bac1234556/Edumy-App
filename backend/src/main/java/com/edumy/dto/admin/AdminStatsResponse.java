package com.edumy.dto.admin;

import com.edumy.entity.Role;
import com.edumy.entity.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@AllArgsConstructor
@Schema(description = "Tổng hợp số liệu dành cho dashboard quản trị.")
public class AdminStatsResponse {

    @Schema(description = "Số người dùng theo vai trò; vai trò không có người dùng có giá trị 0.")
    private Map<Role, Long> usersByRole;

    @Schema(description = "Số người dùng theo trạng thái; trạng thái không có người dùng có giá trị 0.")
    private Map<UserStatus, Long> usersByStatus;

    @Schema(description = "Tổng amount của các order có trạng thái PAID; không tính PENDING hoặc FAILED.", example = "1250000.00")
    private BigDecimal revenue;

    @Schema(description = "Số enrollment theo tháng trong 6 tháng gần nhất, có đủ các tháng kể cả tháng bằng 0.")
    private List<MonthlyEnrollmentCount> enrollmentsLast6Months;

    @Getter
    @AllArgsConstructor
    @Schema(description = "Số enrollment của một tháng.")
    public static class MonthlyEnrollmentCount {
        @Schema(description = "Tháng theo múi giờ Asia/Ho_Chi_Minh, định dạng yyyy-MM.", example = "2026-11")
        private String month;

        @Schema(description = "Số lượt đăng ký khóa học trong tháng.", example = "12")
        private Long count;
    }
}
