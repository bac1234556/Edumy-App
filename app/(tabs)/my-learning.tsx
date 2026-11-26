// app/(tabs)/my-learning.tsx — Học tập (Phòng học của tôi - Infinite Pagination)
import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteMyEnrollments } from '../../src/features/learning/hooks';
import { useRefetchOnScreenFocus } from '../../src/hooks/useRefetchOnScreenFocus';
import { Enrollment } from '../../src/features/learning/logic';
import { useSessionStore } from '../../src/store/session';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { layout, microShadow, monoFontFamily, radius, semantic } from '../../src/theme/tokens';

export default function MyLearningScreen() {
  const router = useRouter();
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMyEnrollments();
  useRefetchOnScreenFocus(refetch);
  const enrollments = data?.pages.flatMap((p) => p.content ?? []) ?? [];
  const totalCount = data?.pages[0]?.page?.totalElements ?? enrollments.length;

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Ionicons name="school-outline" size={26} color={semantic.brandPrimary} />}
          title="Đăng nhập để vào phòng học"
          description="Đăng nhập để tiếp tục các bài học và theo dõi tiến độ học tập của bạn."
          actionTitle="Đăng nhập"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  if (isLoading) {
    return <Loading message="Đang đồng bộ tiến độ học tập..." />;
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        message={error?.message || 'Không thể tải danh sách khóa học'}
        onRetry={() => refetch()}
      />
    );
  }

  if (enrollments.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Ionicons name="book-outline" size={26} color={semantic.brandPrimary} />}
          title="Chưa có khóa học nào"
          description="Ghi danh các khóa học trên Edumy để bắt đầu hành trình học tập của bạn."
          actionTitle="Khám phá ngay"
          onAction={() => router.push('/')}
        />
      </View>
    );
  }

  const completedCount = enrollments.filter((e) => (e.progressPercent ?? 0) >= 100).length;
  const inProgressCount = enrollments.length - completedCount;

  const handleResumeCourse = (enrollment: Enrollment) => {
    if (enrollment.lastAccessedLessonId) {
      router.push(`/learn/lesson/${enrollment.lastAccessedLessonId}` as const);
    } else if (enrollment.course?.id) {
      router.push({
        pathname: '/learn/[courseId]',
        params: { courseId: String(enrollment.course.id), resume: '1' },
      });
    }
  };

  const renderSummaryHeader = () => (
    <View style={[styles.summaryCard, microShadow]}>
      <View style={styles.summaryPrimary}>
        <Text variant="caption" style={styles.summaryPrimaryLabel}>
          Tổng khóa học đang sở hữu
        </Text>
        <Text style={styles.summaryPrimaryValue}>{totalCount}</Text>
      </View>
      <View style={styles.summarySecondaryRow}>
        <Badge
          variant="info"
          label={`${inProgressCount} đang học`}
          icon={<Ionicons name="play-circle-outline" size={13} color={semantic.brandPrimary} />}
        />
        <Badge
          variant="success"
          label={`${completedCount} hoàn thành`}
          icon={<Ionicons name="checkmark-circle-outline" size={13} color={semantic.success} />}
        />
      </View>
    </View>
  );

  const renderEnrollmentCard = ({ item }: { item: Enrollment }) => {
    const progressPercent = item.progressPercent ?? 0;
    const isCompleted = progressPercent >= 100;

    return (
      <View style={[styles.card, microShadow]}>
        <TouchableOpacity
          onPress={() => item.course?.id && router.push(`/learn/${item.course.id}` as const)}
          activeOpacity={0.84}
          accessibilityRole="button"
          accessibilityLabel={`Vào học ${item.course?.title ?? 'khóa học'}`}
        >
          <View style={styles.cardHeaderRow}>
            {item.course?.thumbnailUrl ? (
              <Image source={{ uri: item.course.thumbnailUrl }} style={styles.thumbnail} />
            ) : (
              <View style={styles.placeholderThumbnail}>
                <Ionicons name="book-outline" size={22} color={semantic.brandPrimary} />
              </View>
            )}

            <View style={styles.cardMeta}>
              <Text numberOfLines={2} style={styles.courseTitle}>
                {item.course?.title}
              </Text>

              {item.certificateCode ? (
                <Badge
                  variant="info"
                  label={`Chứng chỉ: ${item.certificateCode}`}
                  icon={<Ionicons name="ribbon-outline" size={13} color={semantic.brandPrimary} />}
                  style={styles.certBadge}
                />
              ) : (
                <Text style={styles.statusSubText}>
                  {isCompleted ? 'Đã hoàn thành toàn bộ bài học' : 'Đang trong tiến trình học'}
                </Text>
              )}
            </View>
          </View>

          {/* Server-Driven Progress Bar & Tabular Metrics */}
          <View style={styles.progressSection}>
            <View style={styles.statsRow}>
              <Text style={[styles.progressPercentText, isCompleted && styles.progressDoneText]}>
                {progressPercent}% hoàn thành
              </Text>
              <Text style={styles.lessonsCountText}>
                {item.completedItems ?? 0}/{item.totalItems ?? 0} bài học
              </Text>
            </View>

            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  isCompleted && styles.progressBarCompleted,
                  { width: `${Math.min(100, progressPercent)}%` },
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Button */}
        <View style={styles.actionRow}>
          <Button
            title={isCompleted ? 'Vào học lại' : 'Học tiếp'}
            onPress={() => handleResumeCourse(item)}
            variant={isCompleted ? 'outline' : 'primary'}
            style={styles.resumeButton}
          />
          {isCompleted && item.course?.id && (
            <Button
              title="⭐ Đánh giá khóa học"
              onPress={() =>
                router.push(
                  `/courses/${item.course?.slug || item.course?.id}/write-review` as const
                )
              }
              variant="primary"
              style={styles.resumeButton}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={enrollments}
        keyExtractor={(item, idx) => String(item.id ?? idx)}
        ListHeaderComponent={renderSummaryHeader}
        renderItem={renderEnrollmentCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={{ paddingVertical: 16 }} color={semantic.brandPrimary} />
          ) : null
        }
      />
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
    paddingBottom: 32,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  summaryCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryPrimary: {
    gap: 2,
  },
  summaryPrimaryLabel: {
    color: semantic.textSecondary,
    fontWeight: '600',
  },
  summaryPrimaryValue: {
    fontFamily: monoFontFamily,
    fontSize: 26,
    fontWeight: '700',
    color: semantic.brandPrimary,
    fontVariant: ['tabular-nums'],
  },
  summarySecondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 96,
    height: 60,
    borderRadius: radius.btn,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  placeholderThumbnail: {
    width: 96,
    height: 60,
    borderRadius: radius.btn,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: semantic.textPrimary,
    lineHeight: 21,
  },
  statusSubText: {
    fontSize: 12,
    color: semantic.textMuted,
    marginTop: 4,
  },
  certBadge: {
    marginTop: 6,
  },
  progressSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: semantic.surfaceMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressPercentText: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: semantic.brandPrimary,
    fontVariant: ['tabular-nums'],
  },
  progressDoneText: {
    color: semantic.success,
  },
  lessonsCountText: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  progressBarBackground: {
    height: 7,
    backgroundColor: semantic.borderSubtle,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: semantic.brandPrimary,
    borderRadius: radius.pill,
  },
  progressBarCompleted: {
    backgroundColor: semantic.success,
  },
  actionRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resumeButton: {
    minHeight: 44,
    flex: 1,
  },
});
