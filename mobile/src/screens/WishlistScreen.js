import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { CourseCard } from '../components/common/CourseCard';
import { getWishlist, removeFromWishlist } from '../api/wishlist';

export const WishlistScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchWishlist = useCallback(async () => {
    try {
      setError(null);
      const data = await getWishlist();
      setCourses(data);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu thích');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };

  const handleRemoveFromWishlist = async (courseId) => {
    // Optimistic update: remove immediately from UI
    const previous = [...courses];
    setCourses((prev) => prev.filter((c) => c.id !== courseId));

    try {
      await removeFromWishlist(courseId);
    } catch (err) {
      // Revert if failed
      setCourses(previous);
      Alert.alert('Lỗi', 'Không thể xóa khóa học khỏi danh sách yêu thích');
    }
  };

  const handleCoursePress = (course) => {
    if (navigation?.navigate) {
      navigation.navigate('CourseDetail', { courseId: course.id });
    }
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải danh sách yêu thích...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khóa học yêu thích</Text>
        <Text style={styles.headerSubtitle}>
          {courses.length} khóa học đã lưu
        </Text>
      </View>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>Danh sách yêu thích trống</Text>
          <Text style={styles.emptyDesc}>
            Khám phá hàng ngàn khóa học chất lượng và lưu lại khóa học bạn quan tâm để học sau nhé!
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate('Home');
              }
            }}
          >
            <Text style={styles.exploreBtnText}>Khám phá ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              layout="vertical"
              isWishlistedInitially={true}
              onPress={handleCoursePress}
              onWishlistToggle={(id) => handleRemoveFromWishlist(id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
