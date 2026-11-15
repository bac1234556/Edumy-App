package com.edumy.service;

import com.edumy.dto.admin.AdminStatsResponse;
import com.edumy.entity.Category;
import com.edumy.entity.Course;
import com.edumy.entity.Enrollment;
import com.edumy.entity.Order;
import com.edumy.entity.OrderStatus;
import com.edumy.entity.PaymentMethod;
import com.edumy.entity.Role;
import com.edumy.entity.User;
import com.edumy.entity.UserStatus;
import com.edumy.repository.CategoryRepository;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.EnrollmentRepository;
import com.edumy.repository.OrderRepository;
import com.edumy.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class AdminStatsSqlVerificationTest {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private AdminStatsService adminStatsService;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    @Test
    @Transactional
    void endpointAggregatesMatchDirectSqlQueries() {
        User instructor = user(Role.INSTRUCTOR, UserStatus.ACTIVE);
        User student = user(Role.STUDENT, UserStatus.ACTIVE);
        User lockedStudent = user(Role.STUDENT, UserStatus.LOCKED);
        Category category = categoryRepository.saveAndFlush(Category.builder()
                .name("Admin stats test")
                .slug("admin-stats-" + UUID.randomUUID())
                .build());
        Course course = courseRepository.saveAndFlush(Course.builder()
                .instructorId(instructor.getId())
                .categoryId(category.getId())
                .title("Admin stats sample")
                .build());

        String transaction = UUID.randomUUID().toString();
        orderRepository.saveAndFlush(Order.builder()
                .userId(student.getId()).courseId(course.getId()).amount(new BigDecimal("125000"))
                .status(OrderStatus.PAID).paymentMethod(PaymentMethod.MOCK).txnRef("PAID-" + transaction).build());
        orderRepository.saveAndFlush(Order.builder()
                .userId(student.getId()).courseId(course.getId()).amount(new BigDecimal("900000"))
                .status(OrderStatus.FAILED).paymentMethod(PaymentMethod.MOCK).txnRef("FAILED-" + transaction).build());

        YearMonth current = YearMonth.now(APP_ZONE);
        Enrollment oldest = enrollmentRepository.saveAndFlush(Enrollment.builder()
                .userId(student.getId()).courseId(course.getId()).build());
        Enrollment newest = enrollmentRepository.saveAndFlush(Enrollment.builder()
                .userId(lockedStudent.getId()).courseId(course.getId()).build());
        jdbcTemplate.update("UPDATE enrollments SET created_at = ? WHERE id = ?",
                Timestamp.valueOf(current.minusMonths(5).atDay(10).atStartOfDay()), oldest.getId());
        jdbcTemplate.update("UPDATE enrollments SET created_at = ? WHERE id = ?",
                Timestamp.valueOf(current.atDay(10).atStartOfDay()), newest.getId());

        AdminStatsResponse response = adminStatsService.getStats();
        Map<Role, Long> rolesFromSql = new EnumMap<>(Role.class);
        for (Role role : Role.values()) rolesFromSql.put(role, 0L);
        jdbcTemplate.query("SELECT role, COUNT(*) AS total FROM users GROUP BY role", (RowCallbackHandler) rs ->
                rolesFromSql.put(Role.valueOf(rs.getString("role")), rs.getLong("total")));

        Map<UserStatus, Long> statusFromSql = new EnumMap<>(UserStatus.class);
        for (UserStatus status : UserStatus.values()) statusFromSql.put(status, 0L);
        jdbcTemplate.query("SELECT status, COUNT(*) AS total FROM users GROUP BY status", (RowCallbackHandler) rs ->
                statusFromSql.put(UserStatus.valueOf(rs.getString("status")), rs.getLong("total")));

        BigDecimal revenueFromSql = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = 'PAID'", BigDecimal.class);

        LocalDateTime from = current.minusMonths(5).atDay(1).atStartOfDay();
        LocalDateTime to = current.plusMonths(1).atDay(1).atStartOfDay();
        Map<YearMonth, Long> enrollmentsFromSql = new HashMap<>();
        jdbcTemplate.query("SELECT YEAR(created_at) AS y, MONTH(created_at) AS m, COUNT(*) AS total " +
                        "FROM enrollments WHERE created_at >= ? AND created_at < ? " +
                        "GROUP BY YEAR(created_at), MONTH(created_at) ORDER BY YEAR(created_at), MONTH(created_at)",
                ps -> {
                    ps.setTimestamp(1, Timestamp.valueOf(from));
                    ps.setTimestamp(2, Timestamp.valueOf(to));
                }, (RowCallbackHandler) rs -> enrollmentsFromSql.put(
                        YearMonth.of(rs.getInt("y"), rs.getInt("m")), rs.getLong("total")));

        assertEquals(rolesFromSql, response.getUsersByRole());
        assertEquals(statusFromSql, response.getUsersByStatus());
        assertEquals(0, revenueFromSql.compareTo(response.getRevenue()));
        assertEquals(6, response.getEnrollmentsLast6Months().size());
        assertEquals(2L, response.getEnrollmentsLast6Months().stream()
                .mapToLong(AdminStatsResponse.MonthlyEnrollmentCount::getCount).sum());
        response.getEnrollmentsLast6Months().forEach(month -> assertEquals(
                enrollmentsFromSql.getOrDefault(YearMonth.parse(month.getMonth()), 0L), month.getCount()));
    }

    private User user(Role role, UserStatus status) {
        String email = "admin-stats-" + UUID.randomUUID() + "@edumy.test";
        return userRepository.saveAndFlush(User.builder()
                .email(email).passwordHash("test-hash").fullName("Admin stats sample")
                .role(role).status(status).build());
    }
}
