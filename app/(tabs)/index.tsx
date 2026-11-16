// app/(tabs)/index.tsx — Khám phá khóa học (Catalog)
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

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khóa học, kỹ năng..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Horizontal Pills */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* All categories */}
          <TouchableOpacity
            style={[styles.pill, selectedCategory === undefined && styles.pillActive]}
            onPress={() => setSelectedCategory(undefined)}
          >
            <Text style={[styles.pillText, selectedCategory === undefined && styles.pillTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>

          {/* Dynamic Categories */}
          {categories?.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, selectedCategory === cat.id && styles.pillActive]}
              onPress={() => setSelectedCategory(cat.id === selectedCategory ? undefined : cat.id)}
            >
              <Text style={[styles.pillText, selectedCategory === cat.id && styles.pillTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Price & Sort Row */}
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
          <Ionicons name="swap-vertical" size={16} color="#0D9488" />
          <Text style={styles.sortBtnText}>
            {sortOption === 'newest' && 'Mới nhất'}
            {sortOption === 'rating' && 'Đánh giá cao'}
            {sortOption === 'price_asc' && 'Giá tăng dần'}
            {sortOption === 'price_desc' && 'Giá giảm dần'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <Loading message="Đang tải danh sách khóa học..." />
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
            icon={<Ionicons name="search-outline" size={48} color="#94A3B8" />}
            title="Không tìm thấy khóa học"
            description="Hãy thử từ khóa khác hoặc điều chỉnh bộ lọc để xem các khóa học hiện có."
            actionTitle="Xóa bộ lọc"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory(undefined);
              setSelectedPrice(undefined);
            }}
          />

          {/* Suggestions if any */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              <Text variant="h3" style={styles.suggestionsHeader}>
                Có thể bạn quan tâm
              </Text>
              {suggestions.map((item: CourseCardType) => (
                <CourseCard key={item.id} course={item} />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => String(item.id)}
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
    backgroundColor: '#FAF9F6',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  filterSection: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0D9488',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  pillTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  subFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  priceToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 2,
  },
  priceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceBtnActive: {
    backgroundColor: '#ffffff',
  },
  priceBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  priceBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortBtnText: {
    fontSize: 13,
    color: '#0D9488',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 16,
  },
  suggestionsBox: {
    marginTop: 20,
  },
  suggestionsHeader: {
    marginBottom: 12,
  },
});
