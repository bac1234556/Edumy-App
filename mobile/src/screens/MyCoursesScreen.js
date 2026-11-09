import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { instructorApi } from '../api/instructorApi';

const STATUS_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'DRAFT', label: 'Bản nháp' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'PUBLISHED', label: 'Đã xuất bản' },
  { key: 'REJECTED', label: 'Bị từ chối' },
];

export const MyCoursesScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [selectedTab, setSelectedTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await instructorApi.getMyCourses();
      setCourses(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener ? navigation.addListener('focus', loadCourses) : null;
    loadCourses();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigation, loadCourses]);

  const filteredCourses = courses.filter((c) => {
    if (selectedTab === 'ALL') return true;
    return c.status === selectedTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return { label: 'Đã xuất bản', bg: '#D1FAE5', color: '#065F46' };
      case 'PENDING':
      case 'PENDING_REVIEW':
        return { label: 'Chờ duyệt', bg: '#FEF3C7', color: '#92400E' };
      case 'REJECTED':
        return { label: 'Từ chối', bg: '#FEE2E2', color: '#991B1B' };
      default:
        return { label: 'Bản nháp', bg: '#F3F4F6', color: '#374151' };
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateMsg}>Đang tải khóa học của bạn...</Text>
      </View>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Đã có lỗi xảy ra</Text>
        <Text style={styles.stateMsg}>{error}</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={loadCourses}>
          <Text style={styles.btnRetryText}>Tải lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Filter Bar */}
      <View style={styles.tabBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tabItem, selectedTab === item.key && styles.tabItemActive]}
              onPress={() => setSelectedTab(item.key)}
            >
              <Text style={[styles.tabText, selectedTab === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 3. Empty State & List */}
      {filteredCourses.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Không có khóa học nào</Text>
          <Text style={styles.stateMsg}>Chưa có khóa học nào trong danh mục này.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            return (
              <TouchableOpacity
                style={styles.courseCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CurriculumEditor', { courseId: item.id })}
              >
                <Image
                  source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/150' }}
                  style={styles.cardImage}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                    <Text style={styles.cardPrice}>
                      {!item.price || item.price === 0 ? 'Miễn phí' : `${Number(item.price).toLocaleString('vi-VN')} đ`}
                    </Text>
                  </View>
                  <Text style={styles.btnEditCurriculum}>Quản lý nội dung (Curriculum) →</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  tabBar: { backgroundColor: '#FFFFFF', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  tabItem: { paddingHorizontal: 16, paddingVertical: 6, marginHorizontal: 4, borderRadius: 20 },
  tabItemActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardImage: { width: 100, height: 90, backgroundColor: '#E5E7EB' },
  cardBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardPrice: { fontSize: 13, fontWeight: '700', color: '#059669' },
  btnEditCurriculum: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  stateMsg: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#DC2626' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  btnRetry: { backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 6, marginTop: 12 },
  btnRetryText: { color: '#FFFFFF', fontWeight: '600' },
});
