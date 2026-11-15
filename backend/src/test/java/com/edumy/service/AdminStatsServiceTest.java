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
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminStatsServiceTest {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Test
    void returnsGroupedMetricsAndSixOrderedMonthsIncludingEmptyMonths() {
        UserRepository users = mock(UserRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        EnrollmentRepository enrollments = mock(EnrollmentRepository.class);

        RoleCountProjection students = mock(RoleCountProjection.class);
        when(students.getRole()).thenReturn(Role.STUDENT);
        when(students.getCount()).thenReturn(4L);
        StatusCountProjection active = mock(StatusCountProjection.class);
        when(active.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(active.getCount()).thenReturn(4L);
        when(users.countUsersGroupedByRole()).thenReturn(List.of(students));
        when(users.countUsersGroupedByStatus()).thenReturn(List.of(active));
        when(orders.sumAmountByStatus(OrderStatus.PAID)).thenReturn(new BigDecimal("1250000.00"));

        YearMonth current = YearMonth.now(APP_ZONE);
        EnrollmentMonthlyProjection old = month(current.minusMonths(5), 2L);
        EnrollmentMonthlyProjection latest = month(current, 3L);
        when(enrollments.countByMonthBetween(any(), any())).thenReturn(List.of(old, latest));

        AdminStatsResponse stats = new AdminStatsService(users, orders, enrollments).getStats();

        assertEquals(3, stats.getUsersByRole().size());
        assertEquals(4L, stats.getUsersByRole().get(Role.STUDENT));
        assertEquals(0L, stats.getUsersByRole().get(Role.ADMIN));
        assertEquals(2, stats.getUsersByStatus().size());
        assertEquals(new BigDecimal("1250000.00"), stats.getRevenue());
        assertEquals(6, stats.getEnrollmentsLast6Months().size());
        assertEquals(current.minusMonths(5).toString(), stats.getEnrollmentsLast6Months().getFirst().getMonth());
        assertEquals(2L, stats.getEnrollmentsLast6Months().getFirst().getCount());
        assertEquals(0L, stats.getEnrollmentsLast6Months().get(1).getCount());
        assertEquals(current.toString(), stats.getEnrollmentsLast6Months().getLast().getMonth());
        assertEquals(3L, stats.getEnrollmentsLast6Months().getLast().getCount());
        verify(orders).sumAmountByStatus(OrderStatus.PAID);
    }

    @Test
    void emptyDatabaseRevenueIsZero() {
        UserRepository users = mock(UserRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        EnrollmentRepository enrollments = mock(EnrollmentRepository.class);
        when(users.countUsersGroupedByRole()).thenReturn(List.of());
        when(users.countUsersGroupedByStatus()).thenReturn(List.of());
        when(orders.sumAmountByStatus(OrderStatus.PAID)).thenReturn(null);
        when(enrollments.countByMonthBetween(any(), any())).thenReturn(List.of());

        AdminStatsResponse stats = new AdminStatsService(users, orders, enrollments).getStats();

        assertEquals(BigDecimal.ZERO, stats.getRevenue());
        assertEquals(6, stats.getEnrollmentsLast6Months().size());
        assertEquals(0L, stats.getEnrollmentsLast6Months().stream().mapToLong(AdminStatsResponse.MonthlyEnrollmentCount::getCount).sum());
    }

    private EnrollmentMonthlyProjection month(YearMonth month, long count) {
        EnrollmentMonthlyProjection projection = mock(EnrollmentMonthlyProjection.class);
        when(projection.getYearNumber()).thenReturn(month.getYear());
        when(projection.getMonthNumber()).thenReturn(month.getMonthValue());
        when(projection.getCount()).thenReturn(count);
        return projection;
    }
}
