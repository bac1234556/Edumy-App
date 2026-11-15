package com.edumy.service;

import com.edumy.dto.admin.AdminStatsResponse;
import com.edumy.entity.OrderStatus;
import com.edumy.entity.Role;
import com.edumy.entity.UserStatus;
import com.edumy.repository.EnrollmentMonthlyProjection;
import com.edumy.repository.EnrollmentRepository;
import com.edumy.repository.OrderRepository;
import com.edumy.repository.RoleCountProjection;
import com.edumy.repository.StatusCountProjection;
import com.edumy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        Map<Role, Long> usersByRole = new EnumMap<>(Role.class);
        for (Role role : Role.values()) usersByRole.put(role, 0L);
        for (RoleCountProjection row : userRepository.countUsersGroupedByRole()) {
            usersByRole.put(row.getRole(), row.getCount());
        }

        Map<UserStatus, Long> usersByStatus = new EnumMap<>(UserStatus.class);
        for (UserStatus status : UserStatus.values()) usersByStatus.put(status, 0L);
        for (StatusCountProjection row : userRepository.countUsersGroupedByStatus()) {
            usersByStatus.put(row.getStatus(), row.getCount());
        }

        YearMonth currentMonth = YearMonth.now(APP_ZONE);
        LocalDateTime from = currentMonth.minusMonths(5).atDay(1).atStartOfDay();
        LocalDateTime to = currentMonth.plusMonths(1).atDay(1).atStartOfDay();
        Map<YearMonth, Long> countsByMonth = enrollmentRepository.countByMonthBetween(from, to).stream()
                .collect(Collectors.toMap(
                        row -> YearMonth.of(row.getYearNumber(), row.getMonthNumber()),
                        EnrollmentMonthlyProjection::getCount));

        List<AdminStatsResponse.MonthlyEnrollmentCount> monthlyCounts = new ArrayList<>(6);
        for (int offset = 0; offset < 6; offset++) {
            YearMonth month = currentMonth.minusMonths(5L - offset);
            monthlyCounts.add(new AdminStatsResponse.MonthlyEnrollmentCount(
                    month.toString(), countsByMonth.getOrDefault(month, 0L)));
        }

        BigDecimal revenue = orderRepository.sumAmountByStatus(OrderStatus.PAID);
        return new AdminStatsResponse(
                usersByRole,
                usersByStatus,
                revenue == null ? BigDecimal.ZERO : revenue,
                monthlyCounts);
    }
}
