// app/learn/[courseId]/index.tsx — Phòng học & Đề cương bài học
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

export default function CourseLearnRoomScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const numericCourseId = Number(courseId);
  const router = useRouter();

  const { data: room, isLoading, isError, error, refetch, isRefetching } = useCourseLearnRoom(
    numericCourseId
  );

  if (isLoading) {
    return <Loading message="Đang tải phòng học..." />;
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
        {/* Course Header Banner */}
        <View style={styles.headerCard}>
          <Text variant="h2" style={styles.courseTitle}>
            {room.title}
          </Text>

          {isInstructorMode ? (
            <View style={styles.instructorModeBanner}>
              <Ionicons name="information-circle-outline" size={18} color="#0D9488" />
              <Text style={styles.instructorModeText}>
                Chế độ xem của giảng viên: Chỉ đọc, không lưu tiến độ học tập.
              </Text>
            </View>
          ) : (
            <View style={styles.progressBox}>
              <View style={styles.progressRow}>
                <Text style={styles.progressPercent}>
                  {room.progress?.percent || 0}% hoàn thành
                </Text>
                <Text style={styles.progressCount}>
                  {room.progress?.completedLessons || 0}/{room.progress?.totalLessons || 0} bài học
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

          {nextLessonId && (
            <Button
              title="Tiếp tục học"
              onPress={() => router.push(`/learn/lesson/${nextLessonId}` as const)}
              style={styles.continueButton}
            />
          )}
        </View>

        {/* Chapters and Lessons */}
        <View style={styles.curriculumSection}>
          <Text variant="h3" style={styles.sectionTitle}>
            Nội dung khóa học
          </Text>

          {room.chapters?.map((chapter, chapterIndex) => (
            <View key={chapter.id} style={styles.chapterCard}>
              <View style={styles.chapterHeader}>
                <Text style={styles.chapterTitle}>
                  Chương {chapterIndex + 1}: {chapter.title}
                </Text>
              </View>

              <View style={styles.lessonsList}>
                {chapter.lessons?.map((lesson, lessonIndex) => (
                  <TouchableOpacity
                    key={lesson.id}
                    style={styles.lessonItem}
                    onPress={() => router.push(`/learn/lesson/${lesson.id}` as const)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.lessonStatusIcon}>
                      {lesson.completed ? (
                        <Ionicons name="checkmark-circle" size={20} color="#059669" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={20} color="#CBD5E1" />
                      )}
                    </View>

                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>
                        {chapterIndex + 1}.{lessonIndex + 1} {lesson.title}
                      </Text>

                      <View style={styles.lessonMetaRow}>
                        <Ionicons
                          name={
                            lesson.contentType === 'video'
                              ? 'videocam-outline'
                              : 'document-text-outline'
                          }
                          size={13}
                          color="#64748B"
                        />
                        <Text style={styles.lessonMetaText}>
                          {lesson.contentType === 'video' ? 'Video' : 'Bài viết'}
                        </Text>
                        {Boolean(lesson.durationSeconds) && (
                          <Text style={styles.lessonMetaText}>
                            · {Math.ceil((lesson.durationSeconds || 0) / 60)} phút
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
    backgroundColor: '#FAF9F6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseTitle: {
    color: '#0F172A',
    marginBottom: 12,
  },
  instructorModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  instructorModeText: {
    fontSize: 13,
    color: '#0D9488',
    flex: 1,
  },
  progressBox: {
    marginBottom: 14,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
    fontVariant: ['tabular-nums'],
  },
  progressCount: {
    fontSize: 13,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 4,
  },
  continueButton: {
    marginTop: 4,
  },
  curriculumSection: {
    gap: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    marginBottom: 4,
  },
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  chapterHeader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
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
  },
  lessonStatusIcon: {
    marginRight: 10,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    lineHeight: 18,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  lessonMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
});
