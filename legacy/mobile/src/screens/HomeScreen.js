import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { CourseCard } from '../components/common/CourseCard';
import { CategoryChip } from '../components/common/CategoryChip';
import { CATEGORIES_MOCK } from '../mock/categoriesMock';
import { COURSES_MOCK } from '../mock/coursesMock';

export const HomeScreen = ({ navigation }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 3 UI States
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [courses, setCourses] = useState(COURSES_MOCK);

  const fetchCourses = () => {
    setIsLoading(true);
    setHasError(false);
    // Simulate fast mock load
    setTimeout(() => {
      setCourses(COURSES_MOCK);
      setIsLoading(false);
      setRefreshing(false);
    }, 400);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  // Filter courses by category and search keyword
  const filteredCourses = courses.filter((c) => {
    const matchCategory =
      selectedCategoryId === 0 || c.categoryId === selectedCategoryId;
    const matchSearch =
      !searchKeyword ||
      c.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      c.subtitle?.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchCategory && matchSearch;
  });

  const featuredCourses = filteredCourses.filter((c) => c.isFeatured);
  const latestCourses = filteredCourses;

  const handleCoursePress = (course) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('CourseDetail', { courseId: course.id, courseTitle: course.title });
    }
  };

  // 1. Loading State View
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateText}>Đang tải danh mục khóa học Edumy...</Text>
      </SafeAreaView>
    );
  }

  // 2. Error State View
  if (hasError) {
    return (
      <SafeAreaView style={styles.stateContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Không thể kết nối đến máy chủ</Text>
        <Text style={styles.stateText}>Vui lòng kiểm tra lại kết nối mạng và thử lại.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchCourses}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khóa học, kỹ năng, giảng viên..."
            placeholderTextColor="#94A3B8"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={() => setSearchKeyword('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTag}>DỰ ÁN EDUMY 2026</Text>
          <Text style={styles.heroTitle}>Nâng tầm tri thức,{'\n'}Làm chủ tương lai</Text>
          <Text style={styles.heroSubtitle}>
            Hơn 100+ khóa học chuẩn quốc tế từ các chuyên gia đầu ngành.
          </Text>
        </View>

        {/* Category Chips Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES_MOCK.map((cat) => (
            <CategoryChip
              key={cat.id}
              name={cat.name}
              isSelected={selectedCategoryId === cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
            />
          ))}
        </ScrollView>

        {/* 3. Empty State View */}
        {filteredCourses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Chưa có khóa học phù hợp</Text>
            <Text style={styles.emptySubtitle}>
              Thử tìm kiếm với từ khóa khác hoặc chọn danh mục "Tất cả".
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => {
                setSelectedCategoryId(0);
                setSearchKeyword('');
              }}
            >
              <Text style={styles.emptyBtnText}>Xem tất cả khóa học</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Section: Khóa học Nổi bật (Horizontal Carousel) */}
            {featuredCourses.length > 0 && (
              <View style={styles.sectionWrapper}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🔥 Khóa học nổi bật</Text>
                  <Text style={styles.sectionSeeAll}>Xem tất cả ({featuredCourses.length})</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredContainer}
                >
                  {featuredCourses.map((course) => (
                    <CourseCard
                      key={`featured-${course.id}`}
                      course={course}
                      layout="horizontal"
                      onPress={handleCoursePress}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section: Khóa học Mới nhất (Vertical List) */}
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>⚡ Mới xuất bản</Text>
                <Text style={styles.sectionSeeAll}>Xem tất cả</Text>
              </View>
              <View style={styles.verticalList}>
                {latestCourses.map((course) => (
                  <CourseCard
                    key={`latest-${course.id}`}
                    course={course}
                    layout="vertical"
                    onPress={handleCoursePress}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearch: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBanner: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
  },
  heroTag: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroSubtitle: {
    color: '#DBEAFE',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSeeAll: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  sectionWrapper: {
    marginTop: 10,
  },
  featuredContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  verticalList: {
    paddingHorizontal: 16,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  stateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
