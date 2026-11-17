// app/(tabs)/my-learning.tsx — Học tập (Phòng học của tôi - Editorial Bento)
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMyEnrollments } from '../../src/features/learning/hooks';
import { useRefetchOnScreenFocus } from '../../src/hooks/useRefetchOnScreenFocus';
import { Enrollment } from '../../src/features/learning/logic';
import { useSessionStore } from '../../src/store/session';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { semantic, radius, monoFontFamily, microShadow } from '../../src/theme/tokens';

export default function MyLearningScreen() {
  const router = useRouter();
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch, isRefetching } = useMyEnrollments(page);
  useRefetchOnScreenFocus(refetch);
  const enrollments = data?.content || [];

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
      router.push(`/learn/${enrollment.course.id}` as const);
    }
  };

  const renderSummaryHeader = () => (
    <View style={styles.summaryBento}>
      <View style={styles.summaryCell}>
        <Text style={styles.summaryValue}>{enrollments.length}</Text>
        <Text style={styles.summaryLabel}>ĐÃ GHI DANH</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryCell}>
        <Text style={[styles.summaryValue, { color: semantic.brandPrimary }]}>
          {inProgressCount}
        </Text>
        <Text style={styles.summaryLabel}>ĐANG HỌC</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryCell}>
        <Text style={[styles.summaryValue, { color: semantic.success }]}>
          {completedCount}
        </Text>
        <Text style={styles.summaryLabel}>HOÀN THÀNH</Text>
      </View>
    </View>
  );

  const renderEnrollmentCard = ({ item }: { item: Enrollment }) => {
    const progressPercent = item.progressPercent ?? 0;
    const isCompleted = progressPercent >= 100;

    return (
      <TouchableOpacity
        style={[styles.card, microShadow]}
        onPress={() => item.course?.id && router.push(`/learn/${item.course.id}` as const)}
        activeOpacity={0.82}
      >
        <View style={styles.cardHeaderRow}>
          {item.course?.thumbnailUrl ? (
            <Image source={{ uri: item.course.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Ionicons name="layers-outline" size={24} color={semantic.brandPrimary} />
            </View>
          )}

          <View style={styles.cardMeta}>
            <Text numberOfLines={2} style={styles.courseTitle}>
              {item.course?.title}
            </Text>

            {item.certificateCode ? (
              <View style={styles.certBadge}>
                <Ionicons name="ribbon-outline" size={13} color={semantic.brandPrimaryStrong} />
                <Text style={styles.certBadgeText}>CHỨNG CHỈ: {item.certificateCode}</Text>
              </View>
            ) : (
              <Text style={styles.statusSubText}>
                {isCompleted ? 'Đã hoàn tất toàn bộ bài học' : 'Đang trong tiến trình học'}
              </Text>
            )}
          </View>
        </View>

        {/* Server-Driven Progress Bar & Tabular Metrics */}
        <View style={styles.progressSection}>
          <View style={styles.statsRow}>
            <Text style={styles.progressPercentText}>
              {progressPercent}% HOÀN THÀNH
            </Text>
            <Text style={styles.lessonsCountText}>
              {item.completedItems ?? 0}/{item.totalItems ?? 0} mục học
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

        {/* Action Button */}
        <View style={styles.actionRow}>
          <Button
            title={isCompleted ? 'Ôn tập bài giảng' : 'Học tiếp bài gần nhất'}
            onPress={() => handleResumeCourse(item)}
            variant={isCompleted ? 'outline' : 'primary'}
            style={styles.resumeButton}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={enrollments}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderSummaryHeader}
        renderItem={renderEnrollmentCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        onEndReached={() => {
          if (data?.page && page + 1 < (data.page.totalPages ?? 0)) {
            setPage((prev) => prev + 1);
          }
        }}
        onEndReachedThreshold={0.4}
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
  },
  summaryBento: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    paddingVertical: 14,
    marginBottom: 16,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: semantic.borderSubtle,
  },
  summaryValue: {
    fontFamily: monoFontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.7,
    marginTop: 3,
  },
  card: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
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
    width: 92,
    height: 62,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  placeholderThumbnail: {
    width: 92,
    height: 62,
    borderRadius: radius.sm,
    backgroundColor: semantic.surfaceSubtle,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
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
    lineHeight: 20,
  },
  statusSubText: {
    fontSize: 12,
    color: semantic.textMuted,
    marginTop: 4,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  certBadgeText: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
    fontVariant: ['tabular-nums'],
  },
  progressSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  progressPercentText: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: semantic.brandPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.4,
  },
  lessonsCountText: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: semantic.brandPrimary,
    borderRadius: 3,
  },
  progressBarCompleted: {
    backgroundColor: semantic.success,
  },
  actionRow: {
    marginTop: 14,
  },
  resumeButton: {
    minHeight: 42,
    paddingVertical: 9,
  },
});
