import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { instructorApi } from '../api/instructorApi';
import { errorMessage } from '../api/client';

const PAGE_SIZE = 10;

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN');
};

export const InstructorStudentsScreen = ({ courseId, courseTitle, onBack }) => {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const loadStudents = useCallback(async ({ refresh = false, nextPage = 0 } = {}) => {
    if (refresh) setRefreshing(true);
    else if (nextPage > 0) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await instructorApi.getCourseStudents(courseId, nextPage, PAGE_SIZE);
      const pageData = response.data?.data || {};
      const content = Array.isArray(pageData.content) ? pageData.content : [];
      setStudents((current) => (nextPage === 0 ? content : [...current, ...content]));
      setPage(Number(pageData.page ?? nextPage));
      setTotalPages(Number(pageData.totalPages || 0));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const renderStudent = ({ item }) => {
    const progress = Math.max(0, Math.min(100, Number(item.progressPercent || 0)));
    return (
      <View style={styles.studentCard}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{(item.fullName || item.email || '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.studentBody}>
          <Text style={styles.studentName} numberOfLines={1}>{item.fullName || 'Học viên'}</Text>
          <Text style={styles.studentEmail} numberOfLines={1}>{item.email || 'Không có email'}</Text>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Tiến độ học tập</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.enrolledAt}>Tham gia: {formatDate(item.enrolledAt)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateText}>Đang tải danh sách học viên...</Text>
      </SafeAreaView>
    );
  }

  if (error && students.length === 0) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.stateIcon}>⚠️</Text>
        <Text style={styles.stateTitle}>Không thể tải học viên</Text>
        <Text style={styles.stateText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadStudents()}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Quay lại</Text>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Danh sách học viên</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{courseTitle || `Khóa học #${courseId}`}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadStudents({ refresh: true })}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={students}
        keyExtractor={(item) => String(item.enrollmentId || item.userId)}
        renderItem={renderStudent}
        contentContainerStyle={students.length === 0 ? styles.emptyList : styles.listContent}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStudents({ refresh: true })}
            colors={['#2563EB']}
          />
        )}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Chưa có học viên</Text>
            <Text style={styles.stateText}>Học viên đăng ký khóa học sẽ xuất hiện tại đây.</Text>
          </View>
        )}
        ListFooterComponent={totalPages > page + 1 ? (
          <TouchableOpacity
            style={styles.loadMoreButton}
            disabled={loadingMore}
            onPress={() => loadStudents({ nextPage: page + 1 })}
          >
            {loadingMore ? <ActivityIndicator color="#2563EB" /> : <Text style={styles.loadMoreText}>Tải thêm học viên</Text>}
          </TouchableOpacity>
        ) : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  stateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  stateIcon: { fontSize: 34, marginBottom: 8 },
  stateTitle: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  stateText: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 8 },
  retryButton: { marginTop: 18, backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 22, paddingVertical: 11 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 7 },
  backButtonText: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
  headerTextWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { color: '#0F172A', fontSize: 19, fontWeight: '800' },
  subtitle: { color: '#64748B', fontSize: 12 },
  listContent: { padding: 16 },
  emptyList: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  studentCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 13, marginBottom: 11 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E2E8F0' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#DBEAFE' },
  avatarInitial: { color: '#1D4ED8', fontSize: 18, fontWeight: '800' },
  studentBody: { flex: 1, marginLeft: 11 },
  studentName: { color: '#1E293B', fontSize: 14, fontWeight: '700' },
  studentEmail: { color: '#64748B', fontSize: 11, marginTop: 3 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 5 },
  progressLabel: { color: '#64748B', fontSize: 11 },
  progressValue: { color: '#059669', fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  enrolledAt: { color: '#94A3B8', fontSize: 10, marginTop: 7 },
  inlineError: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF2F2', padding: 11 },
  inlineErrorText: { color: '#991B1B', flex: 1, fontSize: 11, marginRight: 8 },
  retryText: { color: '#1D4ED8', fontWeight: '700', fontSize: 12 },
  emptyContainer: { alignItems: 'center' },
  emptyIcon: { fontSize: 34, marginBottom: 10 },
  emptyTitle: { color: '#334155', fontSize: 15, fontWeight: '700' },
  loadMoreButton: { alignItems: 'center', padding: 14, marginBottom: 16 },
  loadMoreText: { color: '#2563EB', fontSize: 13, fontWeight: '700' },
});
