import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { errorMessage } from '../api/client';
import { fetchAdminStats } from '../api/adminStats';

const numberFormat = new Intl.NumberFormat('vi-VN');
const currencyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const number = (value) => numberFormat.format(Number(value) || 0);

function StatCard({ title, value, accent, testID }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: accent }]} testID={testID}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function EnrollmentChart({ months }) {
  const maxCount = Math.max(1, ...months.map((item) => item.count));
  return (
    <View style={styles.chart} testID="admin-enrollment-chart" accessibilityLabel="Biểu đồ enrollment 6 tháng">
      {months.map(({ month, count }) => {
        const [year, monthNumber] = month.split('-');
        const height = count === 0 ? 4 : Math.max(8, (count / maxCount) * 112);
        return (
          <View key={month} style={styles.chartColumn} testID={`enrollment-month-${month}`}>
            <Text style={styles.chartCount}>{number(count)}</Text>
            <View style={styles.barArea}>
              <View style={[styles.bar, { height, backgroundColor: count ? '#2563EB' : '#CBD5E1' }]} />
            </View>
            <Text style={styles.chartLabel}>{`${monthNumber}/${year.slice(-2)}`}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function AdminDashboardScreen({ navigation }) {
  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: fetchAdminStats });
  const stats = statsQuery.data;

  if (statsQuery.isPending) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#2563EB" accessibilityLabel="Đang tải số liệu quản trị" />
        <Text style={styles.stateText}>Đang tải dữ liệu tổng quan quản trị...</Text>
      </SafeAreaView>
    );
  }

  if (statsQuery.isError) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Lỗi tải số liệu quản trị</Text>
        <Text style={styles.stateText} accessibilityRole="alert">{errorMessage(statsQuery.error)}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => statsQuery.refetch()} testID="admin-stats-retry">
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const roles = stats.usersByRole ?? {};
  const statuses = stats.usersByStatus ?? {};
  const months = stats.enrollmentsLast6Months ?? [];
  const totalUsers = Object.values(roles).reduce((sum, count) => sum + Number(count || 0), 0);
  const lockedUsers = Number(statuses.LOCKED || 0);
  const totalEnrollments = months.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const isEmpty = totalUsers === 0 && Number(stats.revenue || 0) === 0 && totalEnrollments === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={(
          <RefreshControl
            refreshing={statsQuery.isRefetching}
            onRefresh={() => statsQuery.refetch()}
            colors={['#2563EB']}
          />
        )}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Tổng quan quản trị</Text>
            <Text style={styles.subtitle}>Số liệu hiện tại từ hệ thống</Text>
          </View>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation?.navigate?.('UserManagement')}
            testID="admin-manage-users"
          >
            <Text style={styles.manageButtonText}>Người dùng</Text>
          </TouchableOpacity>
        </View>

        {isEmpty ? (
          <View style={styles.emptyNotice} testID="admin-stats-empty">
            <Text style={styles.emptyTitle}>Chưa có dữ liệu thống kê</Text>
            <Text style={styles.stateText}>Số liệu sẽ xuất hiện khi có người dùng, giao dịch hoặc lượt ghi danh.</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Chỉ số chính</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Tổng người dùng" value={number(totalUsers)} accent="#2563EB" testID="admin-total-users" />
          <StatCard title="Tài khoản bị khóa" value={number(lockedUsers)} accent="#DC2626" testID="admin-locked-users" />
          <StatCard title="Doanh thu đã thanh toán" value={currencyFormat.format(Number(stats.revenue) || 0)} accent="#0F766E" testID="admin-revenue" />
          <StatCard title="Ghi danh 6 tháng" value={number(totalEnrollments)} accent="#D97706" testID="admin-enrollments" />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Ghi danh theo tháng</Text>
          <Text style={styles.chartSubtitle}>6 tháng gần nhất · tháng không có dữ liệu vẫn hiển thị 0</Text>
          <EnrollmentChart months={months} />
        </View>

        <Text style={styles.sectionTitle}>Tác vụ quản trị</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => navigation?.navigate?.('UserManagement')}>
            <Text style={styles.actionTitle}>Quản lý người dùng</Text>
            <Text style={styles.actionDescription}>Tìm kiếm, phân quyền và cập nhật trạng thái</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => navigation?.navigate?.('CourseReviewQueue')}>
            <Text style={styles.actionTitle}>Hàng chờ duyệt khóa học</Text>
            <Text style={styles.actionDescription}>Xem và xử lý khóa học đang chờ duyệt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => navigation?.navigate?.('CategoryManagement')}>
            <Text style={styles.actionTitle}>Quản lý danh mục</Text>
            <Text style={styles.actionDescription}>Cập nhật cấu trúc danh mục khóa học</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 36, gap: 16 },
  stateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAFC', gap: 12 },
  stateText: { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorTitle: { color: '#1E293B', fontSize: 18, fontWeight: '700' },
  retryButton: { marginTop: 4, backgroundColor: '#2563EB', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1 },
  title: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#64748B', fontSize: 13, marginTop: 3 },
  manageButton: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8 },
  manageButtonText: { color: '#1D4ED8', fontSize: 13, fontWeight: '700' },
  emptyNotice: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, gap: 6 },
  emptyTitle: { color: '#1E293B', fontWeight: '700', fontSize: 15, textAlign: 'center' },
  sectionTitle: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48.5%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, minHeight: 88, justifyContent: 'center', elevation: 1 },
  statValue: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  statTitle: { color: '#64748B', fontSize: 12, marginTop: 5 },
  chartCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, gap: 6, elevation: 1 },
  chartSubtitle: { color: '#64748B', fontSize: 12 },
  chart: { height: 176, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minWidth: 38 },
  chartCount: { color: '#475569', fontSize: 10, marginBottom: 4 },
  barArea: { height: 120, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 20, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  chartLabel: { color: '#64748B', fontSize: 10, marginTop: 6 },
  actions: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14 },
  action: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  actionTitle: { color: '#1E293B', fontSize: 14, fontWeight: '700' },
  actionDescription: { color: '#64748B', fontSize: 12, marginTop: 4 },
});
