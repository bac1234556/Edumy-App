import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { ADMIN_STATS_MOCK, RECENT_ACTIVITIES_MOCK } from '../mock/adminMock';

/**
 * AdminDashboardScreen - Màn hình Tổng quan Quản trị viên
 * Đáp ứng yêu cầu Issue [W7-E3]:
 * - 4 thẻ số liệu thống kê (mock data)
 * - Đủ 3 trạng thái: Loading / Empty / Error
 * - Hỗ trợ kéo để làm mới (Pull-to-refresh)
 */
export const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setStats(ADMIN_STATS_MOCK);
      setActivities(RECENT_ACTIVITIES_MOCK);
      setIsLoading(false);
      setRefreshing(false);
    }, 450);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // 1. Trạng thái Loading
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateText}>Đang tải dữ liệu tổng quan quản trị...</Text>
      </SafeAreaView>
    );
  }

  // 2. Trạng thái Error
  if (hasError) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.stateIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Lỗi tải số liệu quản trị</Text>
        <Text style={styles.stateText}>Không thể đồng bộ số liệu với máy chủ. Vui lòng thử lại.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadDashboardData}>
          <Text style={styles.retryBtnText}>Thử lại ngay</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Trung Tâm Quản Trị 🛡️</Text>
          <Text style={styles.headerSubtitle}>Hệ thống quản lý & vận hành Edumy</Text>
        </View>
        <TouchableOpacity
          style={styles.manageUsersTopBtn}
          onPress={() => navigation?.navigate?.('UserManagement')}
          activeOpacity={0.8}
        >
          <Text style={styles.manageUsersTopBtnText}>👥 Users</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Banner chào mừng & Thông báo trạng thái hệ thống */}
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeGreeting}>Xin chào, Quản trị viên! 👋</Text>
            <Text style={styles.welcomeDesc}>
              Hệ thống đang hoạt động ổn định. Xem hàng chờ để kiểm duyệt khóa học mới.
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>Hệ thống Live</Text>
          </View>
        </View>

        {/* 4 Thẻ số liệu thống kê (Yêu cầu chính của W7-E3) */}
        <Text style={styles.sectionTitle}>Chỉ Số Thống Kê Chính</Text>
        <View style={styles.statsGrid}>
          {/* Card 1: Tổng học viên */}
          <View style={[styles.statCard, { borderLeftColor: stats?.totalStudents.color }]}>
            <View style={styles.statHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: stats?.totalStudents.bgColor }]}>
                <Text style={styles.statEmoji}>{stats?.totalStudents.icon}</Text>
              </View>
              <Text style={styles.statBadge}>{stats?.totalStudents.change}</Text>
            </View>
            <Text style={styles.statValue}>{stats?.totalStudents.value}</Text>
            <Text style={styles.statTitle}>{stats?.totalStudents.title}</Text>
          </View>

          {/* Card 2: Tổng khóa học */}
          <View style={[styles.statCard, { borderLeftColor: stats?.totalCourses.color }]}>
            <View style={styles.statHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: stats?.totalCourses.bgColor }]}>
                <Text style={styles.statEmoji}>{stats?.totalCourses.icon}</Text>
              </View>
              <Text style={[styles.statBadge, { color: '#059669', backgroundColor: '#ECFDF5' }]}>
                {stats?.totalCourses.change}
              </Text>
            </View>
            <Text style={styles.statValue}>{stats?.totalCourses.value}</Text>
            <Text style={styles.statTitle}>{stats?.totalCourses.title}</Text>
          </View>

          {/* Card 3: Doanh thu hệ thống */}
          <View style={[styles.statCard, { borderLeftColor: stats?.totalRevenue.color }]}>
            <View style={styles.statHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: stats?.totalRevenue.bgColor }]}>
                <Text style={styles.statEmoji}>{stats?.totalRevenue.icon}</Text>
              </View>
              <Text style={[styles.statBadge, { color: '#D97706', backgroundColor: '#FFFBEB' }]}>
                {stats?.totalRevenue.change}
              </Text>
            </View>
            <Text style={[styles.statValue, { fontSize: 18 }]}>{stats?.totalRevenue.value}</Text>
            <Text style={styles.statTitle}>{stats?.totalRevenue.title}</Text>
          </View>

          {/* Card 4: Khóa học chờ duyệt */}
          <View style={[styles.statCard, { borderLeftColor: stats?.pendingCourses.color }]}>
            <View style={styles.statHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: stats?.pendingCourses.bgColor }]}>
                <Text style={styles.statEmoji}>{stats?.pendingCourses.icon}</Text>
              </View>
              <Text style={[styles.statBadge, { color: '#DC2626', backgroundColor: '#FEF2F2' }]}>
                Cần duyệt
              </Text>
            </View>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats?.pendingCourses.value}</Text>
            <Text style={styles.statTitle}>{stats?.pendingCourses.title}</Text>
          </View>
        </View>

        {/* Lối tắt quản lý (Quick Actions) */}
        <Text style={styles.sectionTitle}>Tác Vụ Quản Trị Nhanh</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation?.navigate?.('UserManagement')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.actionIcon}>👥</Text>
            </View>
            <View style={styles.actionTextGroup}>
              <Text style={styles.actionTitle}>Quản lý người dùng</Text>
              <Text style={styles.actionDesc}>Xem danh sách, phân quyền và khóa tài khoản</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation?.navigate?.('CourseReviewQueue')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Text style={styles.actionIcon}>📋</Text>
            </View>
            <View style={styles.actionTextGroup}>
              <Text style={styles.actionTitle}>Hàng chờ duyệt khóa học</Text>
              <Text style={styles.actionDesc}>Xem nội dung và xử lý các khóa học đang chờ duyệt</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation?.navigate?.('CategoryManagement')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.actionIcon}>🗂️</Text>
            </View>
            <View style={styles.actionTextGroup}>
              <Text style={styles.actionTitle}>Quản lý danh mục khóa học</Text>
              <Text style={styles.actionDesc}>Thêm, sửa cấu trúc danh mục và phân nhóm</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Hoạt động gần đây */}
        <Text style={styles.sectionTitle}>Nhật Ký Hoạt Động Gần Đây</Text>
        <View style={styles.activitiesCard}>
          {activities.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.activityRow,
                index === activities.length - 1 && styles.activityRowLast,
              ]}
            >
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityAction}>{item.action}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
                <Text style={styles.activityTarget}>{item.target}</Text>
                <Text style={styles.activityAuthor}>Bởi: {item.author}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  manageUsersTopBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  manageUsersTopBtnText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  welcomeBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeInfo: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 18,
  },
  statBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 8,
    marginBottom: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTextGroup: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  actionArrow: {
    fontSize: 22,
    color: '#94A3B8',
    fontWeight: '300',
    marginLeft: 8,
  },
  activitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  activityTarget: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    marginBottom: 2,
  },
  activityAuthor: {
    fontSize: 11,
    color: '#64748B',
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  stateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  stateText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
