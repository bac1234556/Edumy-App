// app/(tabs)/index.tsx — Khám phá khóa học
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
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../src/components/ui/Text';
import { Badge } from '../../src/components/ui/Badge';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { AdBanner } from '../../src/components/ui/AdBanner';
import { CourseCard } from '../../src/features/catalog/components/CourseCard';
import { useCourses, useCategories } from '../../src/features/catalog/hooks';
import { CourseFilterParams, CourseCard as CourseCardType } from '../../src/features/catalog/api';
import { usePromotedCourses } from '../../src/features/ads/hooks';
import { PromotedCoursesBanner } from '../../src/features/ads/components/PromotedCoursesBanner';
import { CoursePromoModal } from '../../src/features/ads/components/CoursePromoModal';
import { InlineCourseAdCard } from '../../src/features/ads/components/InlineCourseAdCard';
import { semantic, radius, layout, microShadow } from '../../src/theme/tokens';

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
  const { promotedCourses, modalCourses, inlineFeedCourse } = usePromotedCourses(6);

  const courses = data?.content || [];
  const suggestions = data?.suggestions || [];
  const totalElements = data?.page?.totalElements ?? courses.length;
  const showPromotions = searchQuery.trim().length === 0 && promotedCourses.length > 0;

  const renderLightCatalogHeader = () => (
    <View>
      <View style={[styles.heroCard, microShadow]}>
        <View style={styles.heroTopRow}>
          <Badge
            variant="info"
            label="Kho học liệu Edumy"
            icon={<Ionicons name="sparkles-outline" size={12} color={semantic.brandPrimary} />}
          />
          <Text variant="caption" tabular style={styles.heroCountText}>
            {totalElements} khóa học
          </Text>
        </View>

        <Text variant="h2" style={styles.heroTitle}>
          Học tập thực chiến cùng giảng viên chuyên ngành
        </Text>
        <Text variant="bodySmall" style={styles.heroSubtitle}>
          Lộ trình bài bản, video bài giảng HD và chứng chỉ số đồng bộ với tài khoản website.
        </Text>
      </View>

      {showPromotions && <PromotedCoursesBanner items={promotedCourses} />}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sticky Control Header */}
      <View style={styles.controlPanel}>
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          {/* Search Input */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={semantic.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm khóa học, chủ đề, giảng viên..."
              placeholderTextColor={semantic.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="Xóa từ khóa tìm kiếm"
              >
                <Ionicons name="close-circle" size={18} color={semantic.textPlaceholder} />
              </TouchableOpacity>
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
              accessibilityRole="button"
            >
              <Text style={[styles.pillText, selectedCategory === undefined && styles.pillTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>

            {categories?.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedCategory(active ? undefined : cat.id)}
                  accessibilityRole="button"
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
              accessibilityRole="button"
              accessibilityLabel="Đổi thứ tự sắp xếp khóa học"
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
              <Ionicons name="swap-vertical-outline" size={15} color={semantic.brandPrimary} />
              <Text style={styles.sortBtnText}>
                {sortOption === 'newest' && 'Mới nhất'}
                {sortOption === 'rating' && 'Đánh giá cao'}
                {sortOption === 'price_asc' && 'Giá tăng dần'}
                {sortOption === 'price_desc' && 'Giá giảm dần'}
              </Text>
            </TouchableOpacity>
          </View>
        </ResponsiveContainer>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <Loading message="Đang tải danh mục khóa học..." />
      ) : isError ? (
        <ErrorState
          error={error}
          message={error?.message || 'Không thể tải danh mục khóa học'}
          onRetry={() => refetch()}
        />
      ) : courses.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          <ResponsiveContainer maxWidth={layout.maxContentWidth}>
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
            <AdBanner />
          </ResponsiveContainer>
        </ScrollView>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderLightCatalogHeader}
          ListFooterComponent={<AdBanner />}
          renderItem={({ item, index }) => (
            <View>
              <CourseCard course={item} />
              {index === 2 && showPromotions && inlineFeedCourse && (
                <InlineCourseAdCard item={inlineFeedCourse} />
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}

      <CoursePromoModal items={modalCourses} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  controlPanel: {
    backgroundColor: semantic.surfacePage,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.surfaceMuted,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    minHeight: 44,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: semantic.textPrimary,
    minHeight: 40,
  },
  clearBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: semantic.surfaceCard,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  pillActive: {
    backgroundColor: semantic.brandPrimary,
    borderColor: semantic.brandPrimary,
  },
  pillText: {
    fontSize: 13,
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
    paddingBottom: 12,
    gap: 8,
  },
  priceToggle: {
    flexDirection: 'row',
    backgroundColor: semantic.surfaceMuted,
    borderRadius: radius.btn,
    padding: 3,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  priceBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 6,
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
    color: semantic.brandPrimary,
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    minHeight: 36,
    borderRadius: radius.btn,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    backgroundColor: semantic.surfaceCard,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  heroCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroCountText: {
    fontWeight: '700',
    color: semantic.textSecondary,
  },
  heroTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: semantic.textPrimary,
  },
  heroSubtitle: {
    color: semantic.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  emptyContainer: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  suggestionsSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  suggestionsTitle: {
    marginBottom: 12,
  },
});
