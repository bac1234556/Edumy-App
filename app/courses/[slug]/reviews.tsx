// app/courses/[slug]/reviews.tsx — Danh sách đánh giá khóa học
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourseReviews } from '../../../src/features/catalog/hooks';
import { CourseReviewItem } from '../../../src/features/catalog/api';
import { Text } from '../../../src/components/ui/Text';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { formatDate } from '../../../src/lib/date';
import { layout, microShadow, radius, semantic } from '../../../src/theme/tokens';

export default function CourseReviewsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch, isRefetching } = useCourseReviews(
    slug || '',
    page
  );

  const reviews = data?.content || [];

  if (isLoading) {
    return <Loading message="Đang tải đánh giá..." />;
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        message={error?.message || 'Không thể tải đánh giá khóa học'}
        onRetry={() => refetch()}
      />
    );
  }

  const renderStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? 'star' : 'star-outline'}
          size={15}
          color={star <= Math.round(rating) ? semantic.ratingStar : semantic.borderStrong}
          style={styles.starIcon}
        />
      ))}
    </View>
  );

  const renderReviewItem = ({ item }: { item: CourseReviewItem }) => (
    <View style={[styles.reviewCard, microShadow]}>
      <View style={styles.reviewHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {(item.reviewerName || 'H').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{item.reviewerName || 'Học viên Edumy'}</Text>
          <Text style={styles.reviewDate}>{formatDate(item.createdAt ?? '')}</Text>
        </View>
        {renderStars(item.rating ?? 0)}
      </View>

      {item.comment ? (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      ) : (
        <Text style={styles.emptyComment}>Học viên không để lại lời bình.</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Đánh giá từ học viên', headerBackTitle: 'Quay lại' }} />

      {reviews.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="chatbubbles-outline" size={26} color={semantic.brandPrimary} />}
          title="Chưa có đánh giá nào"
          description="Khóa học này chưa có học viên nào gửi nhận xét."
          actionTitle="Tải lại"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={() => {
            if (data?.page && page + 1 < (data.page.totalPages ?? 0)) {
              setPage((prev) => prev + 1);
            }
          }}
          onEndReachedThreshold={0.4}
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  reviewCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: semantic.brandPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  reviewDate: {
    fontSize: 12,
    color: semantic.textMuted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginLeft: 2,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 21,
    color: semantic.textBody,
  },
  emptyComment: {
    fontSize: 13,
    fontStyle: 'italic',
    color: semantic.textPlaceholder,
  },
});
