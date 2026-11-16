import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { instructorApi } from '../api/instructorApi';
import { errorMessage } from '../api/client';

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const formatCurrency = (value) => `${formatNumber(value)} đ`;

const STAT_ITEMS = [
  { key: 'totalCourses', label: 'Tổng khóa học', icon: '📚' },
  { key: 'totalStudents', label: 'Tổng học viên', icon: '👥' },
  { key: 'totalRevenue', label: 'Tổng doanh thu', icon: '💰', currency: true },
  { key: 'averageRating', label: 'Đánh giá trung bình', icon: '⭐', rating: true },
];

const getStatus = (status) => {
  switch (status) {
    case 'PUBLISHED':
      return { label: 'Đã xuất bản', backgroundColor: '#D1FAE5', color: '#065F46' };
    case 'APPROVED':
      return { label: 'Đã duyệt', backgroundColor: '#DBEAFE', color: '#1E40AF' };
    case 'PENDING':
    case 'PENDING_REVIEW':
      return { label: 'Chờ duyệt', backgroundColor: '#FEF3C7', color: '#92400E' };
    case 'REJECTED':
      return { label: 'Từ chối', backgroundColor: '#FEE2E2', color: '#991B1B' };
    default:
      return { label: 'Bản nháp', backgroundColor: '#F3F4F6', color: '#374151' };
  }
};

export const InstructorDashboardScreen = ({ onOpenStudents, onOpenNotifications }) => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [statsResponse, coursesResponse] = await Promise.all([
        instructorApi.getStats(),
        instructorApi.getMyCourses(),
      ]);
      setStats(statsResponse.data?.data || {});
      setCourses(Array.isArray(coursesResponse.data?.data) ? coursesResponse.data.data : []);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const renderCourse = ({ item }) => {
    const status = getStatus(item.status);
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Xem học viên khóa ${item.title}`}
        activeOpacity={0.85}
        style={styles.courseCard}
        onPress={() => onOpenStudents?.(item)}
      >
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.courseImage} />
        ) : (
          <View style={[styles.courseImage, styles.courseImagePlaceholder]}>
            <Text style={styles.placeholderIcon}>📘</Text>
          </View>
        )}
        <View style={styles.courseBody}>
          <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.courseMetaRow}>
            <Text style={[styles.statusBadge, { backgroundColor: status.backgroundColor, color: status.color }]}>
              {status.label}
            </Text>
            <Text style={styles.studentLink}>Học viên ›</Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Doanh thu</Text>
            <Text style={styles.revenueValue}>{formatCurrency(item.revenue)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateText}>Đang tải dashboard giảng viên...</Text>
      </SafeAreaView>
    );
  }

  if (error && !stats) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.stateIcon}>⚠️</Text>
        <Text style={styles.stateTitle}>Không thể tải dashboard</Text>
        <Text style={styles.stateText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadDashboard()}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        testID="instructor-dashboard-scroll"
        contentContainerStyle={styles.content}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            colors={['#2563EB']}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Instructor Studio</Text>
            <Text style={styles.subtitle}>Tổng quan hoạt động giảng dạy</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={onOpenNotifications}>
            <Text style={styles.notificationButtonText}>Thông báo</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.inlineError}>
            <Text style={styles.inlineErrorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadDashboard(true)}>
              <Text style={styles.inlineRetry}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Thống kê tổng quan</Text>
        <View style={styles.statsGrid}>
          {STAT_ITEMS.map((item) => {
            const value = stats?.[item.key] ?? 0;
            let displayValue = formatNumber(value);
            if (item.currency) displayValue = formatCurrency(value);
            if (item.rating) displayValue = Number(value).toFixed(1);
            return (
              <View key={item.key} style={styles.statCard}>
                <View style={styles.statIconWrap}><Text style={styles.statIcon}>{item.icon}</Text></View>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{displayValue}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Khóa học của tôi</Text>
            <Text style={styles.sectionSubtitle}>{courses.length} khóa học</Text>
          </View>
        </View>

        {courses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>Chưa có khóa học nào</Text>
            <Text style={styles.emptyText}>Các khóa học bạn tạo sẽ xuất hiện tại đây.</Text>
          </View>
        ) : courses.map((course) => (
          <View key={course.id}>{renderCourse({ item: course })}</View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  stateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  stateIcon: { fontSize: 34, marginBottom: 8 },
  stateTitle: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  stateText: { color: '#64748B', fontSize: 14, textAlign: 'center', marginTop: 10 },
  retryButton: { marginTop: 18, backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 22, paddingVertical: 11 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  title: { fontSize: 23, color: '#0F172A', fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  notificationButton: { borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 },
  notificationButtonText: { color: '#1D4ED8', fontWeight: '600', fontSize: 12 },
  inlineError: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inlineErrorText: { color: '#991B1B', flex: 1, fontSize: 12, marginRight: 8 },
  inlineRetry: { color: '#1D4ED8', fontWeight: '700', fontSize: 12 },
  sectionTitle: { color: '#0F172A', fontSize: 17, fontWeight: '800', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: '48.5%', minHeight: 124, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 13, marginBottom: 10 },
  statIconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statIcon: { fontSize: 17 },
  statValue: { color: '#0F172A', fontSize: 19, fontWeight: '800' },
  statLabel: { color: '#64748B', fontSize: 11, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sectionSubtitle: { color: '#94A3B8', fontSize: 12, marginTop: -7, marginBottom: 10 },
  courseCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', marginBottom: 12 },
  courseImage: { width: 104, minHeight: 118, backgroundColor: '#E2E8F0' },
  courseImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 28 },
  courseBody: { flex: 1, padding: 11, justifyContent: 'space-between' },
  courseTitle: { color: '#1E293B', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  courseMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  statusBadge: { overflow: 'hidden', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: '700' },
  studentLink: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  revenueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  revenueLabel: { color: '#64748B', fontSize: 11 },
  revenueValue: { color: '#059669', fontSize: 13, fontWeight: '800' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 28, alignItems: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { color: '#334155', fontSize: 15, fontWeight: '700' },
  emptyText: { color: '#64748B', fontSize: 12, marginTop: 6, textAlign: 'center' },
});
