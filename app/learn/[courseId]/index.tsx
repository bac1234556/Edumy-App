// app/learn/[courseId]/index.tsx — Phòng học & Đề cương kỹ thuật (Technical Curriculum)
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCourseLearnRoom } from '../../../src/features/learning/hooks';
import { resolveFirstOrUncompletedLesson } from '../../../src/features/learning/logic';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { AppError } from '../../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';
import { semantic, radius, monoFontFamily } from '../../../src/theme/tokens';

export default function CourseLearnRoomScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const numericCourseId = Number(courseId);
  const router = useRouter();

  const { data: room, isLoading, isError, error, refetch, isRefetching } = useCourseLearnRoom(
    numericCourseId
  );

  if (isLoading) {
    return <Loading message="Đang tải đề cương phòng học..." />;
  }

  if (isError || !room) {
    const appErr = error as unknown as AppError | null;
    const errorMsg = appErr?.message || 'Không thể tải thông tin phòng học.';
    const isForbidden = appErr?.status === 403;

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Phòng học', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          message={
            isForbidden
              ? 'Bạn cần đăng ký hoặc sở hữu khóa học này để vào phòng học.'
              : errorMsg
          }
          onRetry={() => (isForbidden ? router.back() : refetch())}
        />
      </View>
    );
  }

  const isInstructorMode = room.progress === null;
  const nextLessonId = resolveFirstOrUncompletedLesson(room);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: room.title,
          headerBackTitle: 'Quay lại',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Dark Slate Editorial Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.headerOverline}>EDUMY LEARNING ROOM // ĐỒNG BỘ TIẾN ĐỘ</Text>
          <Text variant="h2" style={styles.courseTitle}>
            {room.title}
          </Text>

          {isInstructorMode ? (
            <View style={styles.instructorModeBanner}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#2DD4BF" />
              <Text style={styles.instructorModeText}>
                Chế độ giảng viên: Xem trước toàn bộ bài giảng (không ghi nhận tiến độ học viên).
              </Text>
            </View>
          ) : (
            <View style={styles.progressBox}>
              <View style={styles.progressRow}>
                <Text style={styles.progressPercent}>
                  {room.progress?.percent || 0}% HOÀN THÀNH
                </Text>
                <Text style={styles.progressCount}>
                  {room.progress?.completedLessons || 0}/{room.progress?.totalLessons || 0} BÀI HỌC
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, room.progress?.percent || 0)}%` },
                  ]}
                />
              </View>
            </View>
          )}

          <View style={styles.headerActions}>
            {nextLessonId && (
              <Button
                title="Tiếp tục bài đang học"
                onPress={() => router.push(`/learn/lesson/${nextLessonId}` as const)}
                style={styles.continueButton}
              />
            )}

            <Button
              title="Diễn đàn Hỏi & Đáp (Q&A)"
              variant="outline"
              onPress={() => router.push(`/learn/${room.courseId}/qa` as const)}
              style={styles.qaButton}
            />
          </View>
        </View>

        {/* Technical Boxed Chapters & Lessons */}
        <View style={styles.curriculumSection}>
          <Text style={styles.sectionOverline}>DANH MỤC CHƯƠNG TRÌNH</Text>
          <Text variant="h3" style={styles.sectionTitle}>
            Đề cương chi tiết
          </Text>

          {room.chapters?.map((chapter, chapterIndex) => (
            <View key={chapter.id} style={styles.chapterCard}>
              <View style={styles.chapterHeader}>
                <Text style={styles.chapterIndex}>
                  CHƯƠNG {String(chapterIndex + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
              </View>

              <View style={styles.lessonsList}>
                {chapter.lessons?.map((lesson, lessonIndex) => (
                  <TouchableOpacity
                    key={lesson.id}
                    style={styles.lessonItem}
                    onPress={() => router.push(`/learn/lesson/${lesson.id}` as const)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.lessonStatusIcon}>
                      {lesson.completed ? (
                        <Ionicons name="checkmark-circle" size={20} color={semantic.success} />
                      ) : (
                        <Ionicons name="ellipse-outline" size={20} color="#CBD5E1" />
                      )}
                    </View>

                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>
                        <Text style={styles.lessonNumber}>
                          {String(chapterIndex + 1).padStart(2, '0')}.{String(lessonIndex + 1).padStart(2, '0')}{' '}
                        </Text>
                        {lesson.title}
                      </Text>

                      <View style={styles.lessonMetaRow}>
                        <Ionicons
                          name={
                            lesson.contentType === 'video'
                              ? 'videocam-outline'
                              : 'document-text-outline'
                          }
                          size={13}
                          color={semantic.textMuted}
                        />
                        <Text style={styles.lessonMetaText}>
                          {lesson.contentType === 'video' ? 'Video' : 'Bài đọc'}
                        </Text>

                        {Boolean(lesson.durationSeconds) && (
                          <Text style={styles.lessonMetaText}>
                            • {Math.ceil((lesson.durationSeconds || 0) / 60)} phút
                          </Text>
                        )}
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 18,
  },
  headerOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2DD4BF',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 19,
    lineHeight: 25,
    color: '#F8FAFC',
    marginBottom: 14,
  },
  instructorModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: radius.sm,
    marginBottom: 14,
  },
  instructorModeText: {
    flex: 1,
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  progressBox: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 14,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressPercent: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#2DD4BF',
    fontVariant: ['tabular-nums'],
  },
  progressCount: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#14B8A6',
    borderRadius: 3,
  },
  headerActions: {
    gap: 8,
  },
  continueButton: {
    minHeight: 44,
  },
  qaButton: {
    minHeight: 42,
    backgroundColor: '#FFFFFF',
  },
  curriculumSection: {
    marginTop: 2,
  },
  sectionOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    marginBottom: 12,
    color: semantic.textPrimary,
  },
  chapterCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    marginBottom: 12,
    overflow: 'hidden',
  },
  chapterHeader: {
    backgroundColor: semantic.surfaceCanvas,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
  },
  chapterIndex: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimary,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  lessonsList: {
    paddingHorizontal: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  lessonStatusIcon: {
    width: 24,
    alignItems: 'center',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonNumber: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: semantic.textPrimary,
    lineHeight: 19,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  lessonMetaText: {
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
