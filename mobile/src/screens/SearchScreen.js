import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { CourseCard } from '../components/common/CourseCard';
import { CATEGORIES_MOCK } from '../mock/categoriesMock';
import { COURSES_MOCK } from '../mock/coursesMock';
import { api } from '../api/client';

const LEVELS = [
  { label: 'Tất cả cấp độ', value: null },
  { label: 'Cơ bản', value: 'BEGINNER' },
  { label: 'Trung cấp', value: 'INTERMEDIATE' },
  { label: 'Nâng cao', value: 'ADVANCED' },
];

const PRICE_OPTIONS = [
  { label: 'Tất cả mức giá', value: null },
  { label: 'Miễn phí (0đ)', value: true },
  { label: 'Có phí', value: false },
];

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá thấp đến cao', value: 'price_asc' },
  { label: 'Giá cao đến thấp', value: 'price_desc' },
];

export const SearchScreen = ({ navigation, route }) => {
  const initialKeyword = route?.params?.initialKeyword || '';
  const initialCategoryId = route?.params?.categoryId || null;

  const [keyword, setKeyword] = useState(initialKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedIsFree, setSelectedIsFree] = useState(null);
  const [selectedSort, setSelectedSort] = useState('newest');

  const [categories, setCategories] = useState(CATEGORIES_MOCK);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const debounceTimer = useRef(null);

  // Debounce search keyword 400ms
  const handleKeywordChange = (text) => {
    setKeyword(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedKeyword(text);
    }, 400);
  };

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const params = {
        page: 0,
        size: 20,
        sort: selectedSort,
      };
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
      if (selectedCategory && selectedCategory > 0) params.categoryId = selectedCategory;
      if (selectedIsFree !== null) params.isFree = selectedIsFree;
      if (selectedLevel) params.level = selectedLevel;

      const [coursesRes, catRes] = await Promise.allSettled([
        api.get('/courses', { params }),
        api.get('/categories'),
      ]);

      if (coursesRes.status === 'fulfilled' && coursesRes.value?.data?.data) {
        const data = coursesRes.value.data.data;
        const list = Array.isArray(data) ? data : (data.content || []);
        setCourses(list);
      } else {
        throw new Error('API request failed');
      }

      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value?.data?.data)) {
        if (catRes.value.data.data.length > 0) setCategories(catRes.value.data.data);
      }
    } catch {
      // Local fallback filter if backend is unavailable
      const filtered = COURSES_MOCK.filter((c) => {
        const matchKeyword =
          !debouncedKeyword.trim() ||
          c.title.toLowerCase().includes(debouncedKeyword.toLowerCase()) ||
          c.subtitle?.toLowerCase().includes(debouncedKeyword.toLowerCase());
        const matchCategory =
          !selectedCategory || c.categoryId === selectedCategory;
        const matchFree =
          selectedIsFree === null ||
          (selectedIsFree ? c.price === 0 : c.price > 0);
        const matchLevel =
          !selectedLevel || c.level === selectedLevel || c.level === 'ALL_LEVELS';
        return matchKeyword && matchCategory && matchFree && matchLevel;
      });

      if (selectedSort === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (selectedSort === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price);
      }
      setCourses(filtered);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [debouncedKeyword, selectedCategory, selectedLevel, selectedIsFree, selectedSort]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults();
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedLevel(null);
    setSelectedIsFree(null);
    setSelectedSort('newest');
    setKeyword('');
    setDebouncedKeyword('');
  };

  const hasActiveFilters =
    selectedCategory !== null ||
    selectedLevel !== null ||
    selectedIsFree !== null ||
    selectedSort !== 'newest';

  const handleCoursePress = (course) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('CourseDetail', { courseId: course.id });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Search Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation && navigation.goBack ? navigation.goBack() : null)}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khóa học, kỹ năng..."
            placeholderTextColor="#94A3B8"
            value={keyword}
            onChangeText={handleKeywordChange}
            returnKeyType="search"
            autoFocus={false}
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => handleKeywordChange('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterBtnIcon}>⚙️</Text>
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Filter Chips Preview Bar */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersRow}>
          <Text style={styles.activeFiltersLabel}>Bộ lọc đang áp dụng:</Text>
          <TouchableOpacity onPress={resetFilters} style={styles.resetQuickBtn}>
            <Text style={styles.resetQuickText}>Đặt lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content Area: Loading / Empty / List / Error */}
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tìm kiếm khóa học...</Text>
        </View>
      ) : hasError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Lỗi kết nối</Text>
          <Text style={styles.errorText}>Không thể kết nối đến máy chủ. Vui lòng thử lại.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchResults}>
            <Text style={styles.retryBtnText}>Thử lại ngay</Text>
          </TouchableOpacity>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Không tìm thấy khóa học</Text>
          <Text style={styles.emptyText}>
            Không có kết quả phù hợp với từ khóa &quot;{debouncedKeyword}&quot; hoặc tiêu chí lọc hiện tại.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
            <Text style={styles.resetBtnText}>Xóa tất cả bộ lọc</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <CourseCard
                course={item}
                layout="vertical"
                onPress={handleCoursePress}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
        />
      )}

      {/* Filter Modal Sheet */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ Lọc Tìm Kiếm</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Sắp xếp */}
            <Text style={styles.filterSectionTitle}>Sắp xếp theo</Text>
            <View style={styles.chipsWrap}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, selectedSort === opt.value && styles.chipSelected]}
                  onPress={() => setSelectedSort(opt.value)}
                >
                  <Text style={[styles.chipText, selectedSort === opt.value && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cấp độ */}
            <Text style={styles.filterSectionTitle}>Trình độ</Text>
            <View style={styles.chipsWrap}>
              {LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={String(lvl.value)}
                  style={[styles.chip, selectedLevel === lvl.value && styles.chipSelected]}
                  onPress={() => setSelectedLevel(lvl.value)}
                >
                  <Text style={[styles.chipText, selectedLevel === lvl.value && styles.chipTextSelected]}>
                    {lvl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mức giá */}
            <Text style={styles.filterSectionTitle}>Mức giá</Text>
            <View style={styles.chipsWrap}>
              {PRICE_OPTIONS.map((pr) => (
                <TouchableOpacity
                  key={String(pr.value)}
                  style={[styles.chip, selectedIsFree === pr.value && styles.chipSelected]}
                  onPress={() => setSelectedIsFree(pr.value)}
                >
                  <Text style={[styles.chipText, selectedIsFree === pr.value && styles.chipTextSelected]}>
                    {pr.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Danh mục */}
            <Text style={styles.filterSectionTitle}>Danh mục</Text>
            <View style={styles.chipsWrap}>
              <TouchableOpacity
                style={[styles.chip, selectedCategory === null && styles.chipSelected]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.chipText, selectedCategory === null && styles.chipTextSelected]}>
                  Tất cả danh mục
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, selectedCategory === cat.id && styles.chipSelected]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextSelected]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetModalBtn} onPress={resetFilters}>
                <Text style={styles.resetModalText}>Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyModalBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyModalText}>Áp dụng ({courses.length} kết quả)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  backIcon: {
    fontSize: 22,
    color: '#0F172A',
    fontWeight: '700',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  filterBtnIcon: {
    fontSize: 18,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  activeFiltersLabel: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  resetQuickBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  resetQuickText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#64748B',
    padding: 4,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  resetModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  resetModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  applyModalBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyModalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

