// app/(tabs)/index.tsx — Khám phá khóa học (Swiss Editorial Catalog)
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { CourseCard } from '../../src/features/catalog/components/CourseCard';
import { useCourses, useCategories } from '../../src/features/catalog/hooks';
import { CourseFilterParams, CourseCard as CourseCardType } from '../../src/features/catalog/api';
import { Ionicons } from '@expo/vector-icons';
import { semantic, radius } from '../../src/theme/tokens';

export default function CatalogScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedPrice, setSelectedPrice] = useState<'free' | 'paid' | undefined>(undefined);
  const [sortOption, setSortOption] = useState<'newest' | 'rating' | 'price_asc' | 'price_desc'>('newest');

  const filterParams: CourseFilterParams = {
    q: searchQuery.trim() || undefined,
    categoryId: selectedCategory,
    price: selectedPrice,
    sort: sortOption,
    size: 20,
  };

  const { data, isLoading, isError, error, refetch, isRefetching } = useCourses(filterParams);
  const { data: categories } = useCategories();

  const courses = data?.content || [];
  const suggestions = data?.suggestions || [];
  const totalElements = data?.page?.totalElements ?? courses.length;

  const renderEditorialHeader = () => (
    <View style={styles.heroBento}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroTag}>
          <View style={styles.heroDot} />
          <Text style={styles.heroTagText}>EDUMY CATALOG // ĐỒNG BỘ TRỰC TIẾP</Text>
        </View>
        <Text style={styles.heroCountBadge}>
          {totalElements} KHÓA HỌC
        </Text>
      </View>

      <Text style={styles.heroTitle}>
        Hệ thống học liệu thực chiến cho kỹ sư &amp; nhà sáng tạo.
      </Text>
      <Text style={styles.heroSubtitle}>
        Lộ trình chuẩn hóa, video bài giảng HD và chứng chỉ số xác thực toàn hệ thống.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sticky Control Header: Search + Category Pills + Segmented Filter */}
      <View style={styles.controlPanel}>
        {/* Search Input with '/' shortcut badge */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={semantic.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm khóa học, chủ đề, giảng viên..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : (
            <View style={styles.shortcutKey}>
              <Text style={styles.shortcutKeyText}>/</Text>
            </View>
          )}
        </View>

        {/* Category Horizontal Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.pill, selectedCategory === undefined && styles.pillActive]}
            onPress={() => setSelectedCategory(undefined)}
          >
            <Text style={[styles.pillText, selectedCategory === undefined && styles.pillTextActive]}>
              Tất cả chuyên mục
            </Text>
          </TouchableOpacity>

          {categories?.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedCategory(active ? undefined : cat.id)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Price Segmented Control & Sort Button */}
        <View style={styles.subFilterRow}>
          <View style={styles.priceToggle}>
            <TouchableOpacity
              style={[styles.priceBtn, selectedPrice === undefined && styles.priceBtnActive]}
              onPress={() => setSelectedPrice(undefined)}
            >
              <Text style={[styles.priceBtnText, selectedPrice === undefined && styles.priceBtnTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.priceBtn, selectedPrice === 'free' && styles.priceBtnActive]}
              onPress={() => setSelectedPrice('free')}
            >
              <Text style={[styles.priceBtnText, selectedPrice === 'free' && styles.priceBtnTextActive]}>
                Miễn phí
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.priceBtn, selectedPrice === 'paid' && styles.priceBtnActive]}
              onPress={() => setSelectedPrice('paid')}
            >
              <Text style={[styles.priceBtnText, selectedPrice === 'paid' && styles.priceBtnTextActive]}>
                Có phí
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => {
              const nextSort: Record<string, 'newest' | 'rating' | 'price_asc' | 'price_desc'> = {
                newest: 'rating',
                rating: 'price_asc',
                price_asc: 'price_desc',
                price_desc: 'newest',
              };
              setSortOption(nextSort[sortOption]);
            }}
          >
            <Ionicons name="options-outline" size={14} color={semantic.brandPrimary} />
            <Text style={styles.sortBtnText}>
              {sortOption === 'newest' && 'Mới nhất'}
              {sortOption === 'rating' && 'Đánh giá cao'}
              {sortOption === 'price_asc' && 'Giá tăng dần'}
              {sortOption === 'price_desc' && 'Giá giảm dần'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <Loading message="Đang tải danh mục khóa học..." />
      ) : isError ? (
        <ErrorState
          message={error?.message || 'Không thể tải danh mục khóa học'}
          onRetry={() => refetch()}
        />
      ) : courses.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          <EmptyState
            icon={<Ionicons name="search-outline" size={26} color={semantic.brandPrimary} />}
            title="Không tìm thấy khóa học phù hợp"
            description="Hãy thử điều chỉnh từ khóa hoặc xóa bộ lọc để xem toàn bộ danh mục."
            actionTitle="Đặt lại bộ lọc"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory(undefined);
              setSelectedPrice(undefined);
            }}
          />

          {suggestions.length > 0 && (
            <View style={styles.suggestionsSection}>
              <Text variant="h2" style={styles.suggestionsTitle}>
                Gợi ý khóa học nổi bật
              </Text>
              {suggestions.map((course: CourseCardType) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderEditorialHeader}
          renderItem={({ item }) => <CourseCard course={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  controlPanel: {
    backgroundColor: semantic.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.surfaceCanvas,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: semantic.borderStrong,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: semantic.textPrimary,
  },
  shortcutKey: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  shortcutKeyText: {
    fontSize: 11,
    fontWeight: '700',
    color: semantic.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: semantic.surfaceCanvas,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  pillActive: {
    backgroundColor: semantic.textPrimary,
    borderColor: semantic.textPrimary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: semantic.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  subFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  priceToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  priceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  priceBtnActive: {
    backgroundColor: semantic.surfaceCard,
  },
  priceBtnText: {
    fontSize: 12,
    color: semantic.textMuted,
    fontWeight: '600',
  },
  priceBtnTextActive: {
    color: semantic.textPrimary,
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    backgroundColor: semantic.surfaceCanvas,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  heroBento: {
    backgroundColor: '#0F172A',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2DD4BF',
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2DD4BF',
    letterSpacing: 0.7,
  },
  heroCountBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontVariant: ['tabular-nums'],
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    paddingBottom: 32,
  },
  suggestionsSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  suggestionsTitle: {
    marginBottom: 12,
  },
});
