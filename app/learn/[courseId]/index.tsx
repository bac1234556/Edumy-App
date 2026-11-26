// app/learn/[courseId]/index.tsx — Phòng học & Đề cương khóa học
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourseLearnRoom } from '../../../src/features/learning/hooks';
import { useRefetchOnScreenFocus } from '../../../src/hooks/useRefetchOnScreenFocus';
import {
  resolveFirstOrUncompletedLesson,
  isLessonUnlocked,
  isChapterQuizUnlocked,
} from '../../../src/features/learning/logic';
import { notify } from '../../../src/lib/dialog';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ResponsiveContainer } from '../../../src/components/ui/ResponsiveContainer';
import { AppError } from '../../../src/api/problem';
import { webLinks } from '../../../src/lib/web-links';
import { semantic, radius, monoFontFamily, layout } from '../../../src/theme/tokens';

export default function CourseLearnRoomScreen() {
  const { courseId, resume } = useLocalSearchParams<{ courseId: string; resume?: string }>();
  const numericCourseId = Number(courseId);
  const router = useRouter();
  const hasAutoResumedRef = useRef(false);

  const { data: room, isLoading, isError, error, refetch, isRefetching } = useCourseLearnRoom(
    numericCourseId
  );
  useRefetchOnScreenFocus(refetch);

  const autoLessonId = room
    ? (room.lastAccessedLessonId ?? resolveFirstOrUncompletedLesson(room))
    : null;

  useEffect(() => {
    if (resume === '1' && room && autoLessonId && !hasAutoResumedRef.current) {
      hasAutoResumedRef.current = true;
      router.push(`/learn/lesson/${autoLessonId}` as const);
    }
  }, [resume, room, autoLessonId, router]);

  if (isLoading) {
    return <Loading message="Đang tải đề cương phòng học..." />;
  }

  if (isError || !room) {
    const appErr = error as unknown as AppError | null;
    const errorMsg = appErr?.message || 'Không thể tải thông tin phòng học.';
    const isForbidden = appErr?.status === 403 || appErr?.code === 'NOT_ENROLLED';

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Phòng học', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          error={error}
          message={
            isForbidden
              ? 'Bạn cần đăng ký hoặc sở hữu khóa học này để vào phòng học.'
              : errorMsg
          }
          retryLabel={isForbidden ? 'Quay lại' : 'Thử lại'}
          onRetry={() => (isForbidden ? router.back() : refetch())}
        />
      </View>
    );
  }

  const isInstructorMode = room.progress === null;
  const nextLessonId = resolveFirstOrUncompletedLesson(room);
  const progressPercent = room.progress?.percent ?? 0;

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
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          {/* Light Mode Editorial Header Card */}
          <Card style={styles.headerCard}>
            <Badge
              variant="info"
              label="Phòng học khóa học"
              icon={<Ionicons name="school-outline" size={13} color={semantic.brandPrimary} />}
              style={styles.headerBadge}
            />
            <Text variant="h2" style={styles.courseTitle}>
              {room.title}
            </Text>

            {isInstructorMode ? (
              <View style={styles.instructorModeBanner}>
                <Ionicons name="shield-checkmark-outline" size={18} color={semantic.brandPrimary} />
                <Text style={styles.instructorModeText}>
                  Chế độ giảng viên: Xem trước toàn bộ bài giảng (không ghi nhận tiến độ học viên).
                </Text>
              </View>
            ) : (
              <View style={styles.progressBox}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressPercent}>
                    {progressPercent}% hoàn thành
                  </Text>
                  <Text style={styles.progressCount}>
                    {room.progress?.completedItems || 0}/{room.progress?.totalItems || 0} mục học
                  </Text>
                </View>

                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      progressPercent >= 100 && styles.progressBarDone,
                      { width: `${Math.min(100, progressPercent)}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            <View style={styles.headerActions}>
              {nextLessonId && (
                <Button
                  title={progressPercent >= 100 ? 'Xem lại bài giảng' : 'Học tiếp'}
                  variant={progressPercent >= 100 ? 'outline' : 'primary'}
                  onPress={() => router.push(`/learn/lesson/${nextLessonId}` as const)}
                />
              )}

              {!isInstructorMode && progressPercent >= 100 && (
                <Button
                  title="🏆 Xem chứng chỉ hoàn thành"
                  variant="primary"
                  onPress={() => router.push('/account/certificates' as const)}
                />
              )}

              {!isInstructorMode && (
                <Button
                  title={
                    progressPercent >= 100
                      ? '⭐ Đánh giá khóa học (Đã hoàn thành 100%)'
                      : '⭐ Đánh giá khóa học'
                  }
                  variant={progressPercent >= 100 ? 'outline' : 'outline'}
                  onPress={() =>
                    router.push(`/courses/${room.courseId}/write-review` as const)
                  }
                />
              )}

              <Button
                title="Diễn đàn Hỏi & Đáp (Q&A)"
                variant="secondary"
                onPress={() => router.push(`/learn/${room.courseId}/qa` as const)}
              />
            </View>
          </Card>

          {/* Curriculum */}
          <View style={styles.curriculumSection}>
            <Text variant="overline" style={styles.sectionOverline}>
              Chương trình học
            </Text>
            <Text variant="h3" style={styles.sectionTitle}>
              Đề cương chi tiết
            </Text>

            {room.chapters?.map((chapter, chapterIndex) => (
              <Card key={chapter.id} padded={false} style={styles.chapterCard}>
                <View style={styles.chapterHeader}>
                  <Text style={styles.chapterIndex}>
                    Chương {String(chapterIndex + 1).padStart(2, '0')}
                  </Text>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                </View>

                <View style={styles.lessonsList}>
                  {chapter.lessons?.map((lesson, lessonIndex) => {
                    const unlocked =
                      lesson.id !== undefined ? isLessonUnlocked(room, lesson.id) : true;

                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        style={[styles.lessonItem, !unlocked && styles.lessonItemLocked]}
                        onPress={() => {
                          if (!unlocked) {
                            void notify(
                              'Bài học đang khóa',
                              'Bạn phải xem hết tất cả nội dung và hoàn thành bài học trước đó theo thứ tự thì mới xem được bài tiếp theo.'
                            );
                            return;
                          }
                          router.push(`/learn/lesson/${lesson.id}` as const);
                        }}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`Mở bài học ${lesson.title}`}
                      >
                        <View style={styles.lessonStatusIcon}>
                          {lesson.completed ? (
                            <Ionicons name="checkmark-circle" size={20} color={semantic.success} />
                          ) : unlocked ? (
                            <Ionicons
                              name="play-circle-outline"
                              size={20}
                              color={semantic.brandPrimary}
                            />
                          ) : (
                            <Ionicons
                              name="lock-closed-outline"
                              size={18}
                              color={semantic.textMuted}
                            />
                          )}
                        </View>

                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonTitle, !unlocked && styles.lessonTitleLocked]}>
                            <Text style={styles.lessonNumber}>
                              {String(chapterIndex + 1).padStart(2, '0')}.
                              {String(lessonIndex + 1).padStart(2, '0')}{' '}
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
                                · {Math.ceil((lesson.durationSeconds || 0) / 60)} phút
                              </Text>
                            )}

                            {!unlocked && (
                              <Text style={styles.lockedHintText}>
                                · Khóa (Hoàn thành bài trước)
                              </Text>
                            )}
                          </View>
                        </View>

                        <Ionicons
                          name={unlocked ? 'chevron-forward' : 'lock-closed-outline'}
                          size={16}
                          color={semantic.textPlaceholder}
                        />
                      </TouchableOpacity>
                    );
                  })}

                  {chapter.quizzes?.map((quiz) => {
                    const quizUnlocked = isChapterQuizUnlocked(room, chapterIndex);

                    return (
                      <TouchableOpacity
                        key={`quiz-${quiz.id}`}
                        style={[styles.lessonItem, !quizUnlocked && styles.lessonItemLocked]}
                        onPress={() => {
                          if (!quizUnlocked) {
                            void notify(
                              'Bài kiểm tra đang khóa',
                              'Bạn phải xem hết và hoàn thành tất cả các bài học trước đó mới được mở bài kiểm tra này.'
                            );
                            return;
                          }
                          void WebBrowser.openBrowserAsync(webLinks.course(numericCourseId));
                        }}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`Làm bài kiểm tra ${quiz.title} trên website`}
                      >
                        <View style={styles.lessonStatusIcon}>
                          {quiz.passed ? (
                            <Ionicons name="checkmark-circle" size={20} color={semantic.success} />
                          ) : quizUnlocked ? (
                            <Ionicons
                              name="help-circle-outline"
                              size={20}
                              color={semantic.brandPrimary}
                            />
                          ) : (
                            <Ionicons
                              name="lock-closed-outline"
                              size={18}
                              color={semantic.textMuted}
                            />
                          )}
                        </View>

                        <View style={styles.lessonInfo}>
                          <Text
                            style={[styles.lessonTitle, !quizUnlocked && styles.lessonTitleLocked]}
                          >
                            {quiz.title}
                          </Text>
                          <View style={styles.lessonMetaRow}>
                            <Ionicons
                              name="globe-outline"
                              size={13}
                              color={quizUnlocked ? semantic.brandPrimary : semantic.textMuted}
                            />
                            <Text
                              style={[
                                styles.lessonMetaText,
                                {
                                  color: quizUnlocked
                                    ? semantic.brandPrimary
                                    : semantic.textMuted,
                                },
                              ]}
                            >
                              Bài kiểm tra — làm trên website
                            </Text>
                            {quiz.passed ? (
                              <Text style={[styles.lessonMetaText, { color: semantic.success }]}>
                                · Đã đạt
                              </Text>
                            ) : !quizUnlocked ? (
                              <Text style={styles.lockedHintText}>
                                · Khóa (Hoàn thành bài trước)
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <Ionicons
                          name={quizUnlocked ? 'open-outline' : 'lock-closed-outline'}
                          size={16}
                          color={quizUnlocked ? semantic.brandPrimary : semantic.textPlaceholder}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            ))}
          </View>
        </ResponsiveContainer>
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
    borderColor: semantic.brandBorder,
    marginBottom: 18,
  },
  headerBadge: {
    marginBottom: 10,
  },
  courseTitle: {
    fontSize: 19,
    lineHeight: 26,
    color: semantic.textPrimary,
    marginBottom: 14,
  },
  instructorModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    padding: 12,
    borderRadius: radius.btn,
    marginBottom: 14,
  },
  instructorModeText: {
    flex: 1,
    fontSize: 13,
    color: semantic.brandPrimaryHover,
    lineHeight: 19,
  },
  progressBox: {
    backgroundColor: semantic.surfaceCanvas,
    padding: 12,
    borderRadius: radius.btn,
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
    color: semantic.brandPrimary,
    fontVariant: ['tabular-nums'],
  },
  progressCount: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  progressBarTrack: {
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
  progressBarDone: {
    backgroundColor: semantic.success,
  },
  headerActions: {
    gap: 10,
  },
  curriculumSection: {
    marginTop: 2,
  },
  sectionOverline: {
    color: semantic.brandPrimary,
    marginBottom: 2,
  },
  sectionTitle: {
    marginBottom: 12,
    color: semantic.textPrimary,
  },
  chapterCard: {
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
    fontSize: 11,
    fontWeight: '700',
    color: semantic.brandPrimary,
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
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: semantic.surfaceMuted,
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
  lessonItemLocked: {
    opacity: 0.58,
  },
  lessonTitleLocked: {
    color: semantic.textMuted,
  },
  lockedHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: semantic.warning,
  },
});
