// app/(tabs)/my-learning.tsx — Học tập (Khóa học của tôi)
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
import { Enrollment } from '../../src/features/learning/logic';
import { useSessionStore } from '../../src/store/session';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Loading } from '../../src/components/ui/Loading';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function MyLearningScreen() {
  const router = useRouter();
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch, isRefetching } = useMyEnrollments(page);
  const enrollments = data?.content || [];

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Ionicons name="school-outline" size={56} color="#94A3B8" />}
          title="Đăng nhập để vào phòng học"
          description="Đăng nhập để tiếp tục các bài học và theo dõi tiến độ học tập của bạn."
          actionTitle="Đăng nhập"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  if (isLoading) {
    return <Loading message="Đang tải các khóa học của bạn..." />;
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
          icon={<Ionicons name="book-outline" size={56} color="#94A3B8" />}
          title="Chưa có khóa học nào"
          description="Ghi danh các khóa học trên Edumy để bắt đầu hành trình học tập của bạn."
          actionTitle="Khám phá ngay"
          onAction={() => router.push('/')}
        />
      </View>
    );
  }

  const handleResumeCourse = (enrollment: Enrollment) => {
    if (enrollment.lastAccessedLessonId) {
      router.push(`/learn/lesson/${enrollment.lastAccessedLessonId}` as const);
    } else {
      router.push(`/learn/${enrollment.course.id}` as const);
    }
  };

  const renderEnrollmentCard = ({ item }: { item: Enrollment }) => {
    const isCompleted = item.progressPercent >= 100;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/learn/${item.course.id}` as const)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderRow}>
          {item.course.thumbnailUrl ? (
            <Image source={{ uri: item.course.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Ionicons name="school-outline" size={26} color="#0D9488" />
            </View>
          )}

          <View style={styles.cardMeta}>
            <Text numberOfLines={2} style={styles.courseTitle}>
              {item.course.title}
            </Text>

            {item.certificateCode && (
              <View style={styles.certBadge}>
                <Ionicons name="ribbon-outline" size={14} color="#0D9488" />
                <Text style={styles.certBadgeText}>Đã cấp chứng chỉ</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Bar & Stats */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, item.progressPercent)}%` },
              ]}
            />
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.progressPercentText}>
              {item.progressPercent}% hoàn thành
            </Text>
            <Text style={styles.lessonsCountText}>
              {item.completedLessons}/{item.totalLessons} bài học
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionRow}>
          <Button
            title={isCompleted ? 'Xem lại bài học' : 'Học tiếp'}
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
        renderItem={renderEnrollmentCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        onEndReached={() => {
          if (data?.page && page + 1 < data.page.totalPages) {
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
    backgroundColor: '#FAF9F6',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  thumbnail: {
    width: 90,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  placeholderThumbnail: {
    width: 90,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMeta: {
    flex: 1,
    marginLeft: 12,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    gap: 4,
  },
  certBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
    fontVariant: ['tabular-nums'],
  },
  lessonsCountText: {
    fontSize: 12,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  actionRow: {
    marginTop: 4,
  },
  resumeButton: {
    height: 40,
  },
});
