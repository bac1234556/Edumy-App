// app/instructor/courses/[courseId]/students.tsx — Danh sách học viên của khóa học (Phân trang)
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteInstructorCourseStudents } from '../../../../src/features/instructor/hooks';
import { StudentRosterItem } from '../../../../src/features/instructor/api';
import { useRefetchOnScreenFocus } from '../../../../src/hooks/useRefetchOnScreenFocus';
import { Text } from '../../../../src/components/ui/Text';
import { Badge } from '../../../../src/components/ui/Badge';
import { Loading } from '../../../../src/components/ui/Loading';
import { ErrorState } from '../../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { formatDate } from '../../../../src/lib/date';
import { layout, microShadow, radius, semantic } from '../../../../src/theme/tokens';

export default function CourseStudentsScreen() {
  const { courseId, title } = useLocalSearchParams<{ courseId: string; title?: string }>();
  const numericCourseId = Number(courseId);

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
  } = useInfiniteInstructorCourseStudents(numericCourseId);

  useRefetchOnScreenFocus(refetch);

  const students = data?.pages.flatMap((p) => p.content ?? []) ?? [];
  const totalElements = data?.pages[0]?.page?.totalElements ?? students.length;

  if (isLoading) {
    return <Loading message="Đang tải danh sách học viên..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Học viên khóa học', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          error={error}
          message={error?.message || 'Không thể tải danh sách học viên.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const renderStudent = ({ item }: { item: StudentRosterItem }) => {
    const pct = Math.min(100, Math.max(0, item.progressPercentage ?? 0));
    return (
      <View style={[styles.card, microShadow]}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.fullName || 'H').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.name}>{item.fullName || `Học viên #${item.userId}`}</Text>
            {Boolean(item.email) && <Text style={styles.email}>{item.email}</Text>}
            <Text style={styles.enrolledText}>
              Ghi danh: {formatDate(item.enrolledAt ?? '')}
            </Text>
          </View>
          <Badge variant={pct >= 100 ? 'success' : 'info'} label={`${pct}%`} />
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              pct >= 100 && styles.progressFillDone,
              { width: `${pct}%` },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: title ? `Học viên: ${title}` : 'Học viên khóa học',
          headerBackTitle: 'Quay lại',
        }}
      />

      {students.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="people-outline" size={26} color={semantic.brandPrimary} />}
          title="Chưa có học viên nào"
          description="Khóa học này chưa có học viên ghi danh."
          actionTitle="Tải lại"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item, idx) => String(item.enrollmentId ?? item.userId ?? idx)}
          ListHeaderComponent={
            <Text style={styles.headerCount}>
              Tổng số học viên: {totalElements}
            </Text>
          }
          renderItem={renderStudent}
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
  headerCount: {
    fontSize: 13,
    fontWeight: '700',
    color: semantic.textSecondary,
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  card: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: semantic.brandPrimary,
    fontSize: 15,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  email: {
    fontSize: 12,
    color: semantic.textSecondary,
    marginTop: 1,
  },
  enrolledText: {
    fontSize: 12,
    color: semantic.textMuted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: semantic.borderSubtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: semantic.brandPrimary,
    borderRadius: radius.pill,
  },
  progressFillDone: {
    backgroundColor: semantic.success,
  },
});
