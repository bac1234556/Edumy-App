import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MOCK_COURSES, CourseItem } from '../mock/courses.mock';

interface Props {
  navigation: any;
}

export const MyCoursesScreen: React.FC<Props> = ({ navigation }) => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      // Giả lập load thành công (có thể đổi sang setError('...') để test giao diện lỗi)
      setCourses(MOCK_COURSES);
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const getStatusBadge = (status: CourseItem['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return { label: 'Đã xuất bản', bg: '#D1FAE5', text: '#065F46' };
      case 'APPROVED':
        return { label: 'Đã duyệt', bg: '#DBEAFE', text: '#1E40AF' };
      case 'PENDING_REVIEW':
        return { label: 'Chờ duyệt', bg: '#FEF3C7', text: '#92400E' };
      case 'REJECTED':
        return { label: 'Từ chối', bg: '#FEE2E2', text: '#991B1B' };
      case 'DRAFT':
      default:
        return { label: 'Bản nháp', bg: '#F3F4F6', text: '#374151' };
    }
  };

  // 1. Trạng thái Loading
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>Đang tải danh sách khóa học...</Text>
      </View>
    );
  }

  // 2. Trạng thái Error
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Có lỗi xảy ra!</Text>
        <Text style={styles.statusText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={fetchCourses}>
          <Text style={styles.primaryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Render từng item khóa học
  const renderItem = ({ item }: { item: CourseItem }) => {
    const badge = getStatusBadge(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CourseForm', { course: item })}
      >
        <Image
          source={{ uri: item.thumbnail_url || 'https://via.placeholder.com/150' }}
          style={styles.thumbnail}
        />
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: badge.bg }]}>
              <Text style={[styles.chipText, { color: badge.text }]}>{badge.label}</Text>
            </View>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>

          <Text style={styles.priceText}>
            {item.price === 0 ? 'Miễn phí' : `${item.price.toLocaleString('vi-VN')} đ`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khóa học của tôi</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CourseForm', { course: null })}
        >
          <Text style={styles.createButtonText}>+ Tạo khóa mới</Text>
        </TouchableOpacity>
      </View>

      {/* Trạng thái Empty */}
      {courses.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Chưa có khóa học nào</Text>
          <Text style={styles.statusText}>Hãy bắt đầu chia sẻ kiến thức bằng cách tạo khóa học đầu tiên.</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 16 }]}
            onPress={() => navigation.navigate('CourseForm', { course: null })}
          >
            <Text style={styles.primaryButtonText}>Tạo khóa học ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  createButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  listContainer: { padding: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  thumbnail: { width: 110, height: 100, backgroundColor: '#E5E7EB' },
  cardContent: { flex: 1, padding: 10, justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  courseTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937', flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  chipText: { fontSize: 11, fontWeight: '600' },
  levelText: { fontSize: 12, color: '#6B7280' },
  priceText: { fontSize: 14, fontWeight: '700', color: '#059669' },
  statusText: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#DC2626' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600' },
});