// app/courses/[slug]/index.tsx — Chi tiết khóa học
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notify } from '../../../src/lib/dialog';
import { useCourseDetail, useFreeEnroll } from '../../../src/features/catalog/hooks';
import { resolveCourseAction } from '../../../src/features/catalog/logic';
import { useMyEnrollments } from '../../../src/features/learning/hooks';
import { useSessionStore } from '../../../src/store/session';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { MoneyText } from '../../../src/components/ui/MoneyText';
import { ResponsiveContainer } from '../../../src/components/ui/ResponsiveContainer';
import { AdBanner } from '../../../src/components/ui/AdBanner';
import { useInterstitialAd } from '../../../src/lib/ads';
import { webLinks } from '../../../src/lib/web-links';
import { AppError } from '../../../src/api/problem';
import { semantic, radius, monoFontFamily, layout } from '../../../src/theme/tokens';

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  const { data: course, isLoading, isError, error, refetch } = useCourseDetail(slug);
  const { mutate: freeEnroll, isPending: isEnrolling } = useFreeEnroll(slug);
  const { data: enrollmentsPage } = useMyEnrollments(0);
  const { showIfReady: showInterstitialIfReady } = useInterstitialAd();

  if (isLoading) {
    return <Loading message="Đang tải thông tin khóa học..." />;
  }

  if (isError || !course) {
    return (
      <ErrorState
        error={error}
        message={error?.message || 'Không tìm thấy thông tin khóa học.'}
        onRetry={() => refetch()}
      />
    );
  }

  const matchedEnrollment = (enrollmentsPage?.content ?? []).find(
    (e) => e.course?.id === course.id
  );
  const lastAccessedLessonId = matchedEnrollment?.lastAccessedLessonId;

  const actionState = resolveCourseAction({
    isLoggedIn,
    isFree: Boolean(course.isFree),
    viewer: course.viewer
      ? {
          owned: Boolean(course.viewer.owned),
          isInstructor: Boolean(course.viewer.isInstructor),
        }
      : null,
    lastAccessedLessonId,
  });

  const handlePrimaryAction = async () => {
    switch (actionState.primaryAction) {
      case 'LOGIN_TO_ENROLL':
        router.push('/(auth)/login');
        break;
      case 'OPEN_LEARNING':
        if (lastAccessedLessonId) {
          router.push(`/learn/lesson/${lastAccessedLessonId}` as const);
        } else if (course.id) {
          router.push(`/learn/${course.id}` as const);
        }
        break;
      case 'FREE_ENROLL':
        if (!course.id) break;
        freeEnroll(course.id, {
          onSuccess: () => {
            router.push(`/learn/${course.id}` as const);
          },
          onError: (err) => {
            const appErr = err as unknown as AppError;
            void notify('Không thể ghi danh', appErr.message || 'Vui lòng thử lại sau.');
          },
        });
        break;
      case 'BUY_ON_WEB':
        if (!course.id) break;
        await WebBrowser.openBrowserAsync(webLinks.course(course.id));
        break;
      default:
        break;
    }
  };

  const totalMinutes = course.totalDurationSeconds
    ? Math.max(1, Math.ceil(course.totalDurationSeconds / 60))
    : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: course.title, headerBackTitle: 'Quay lại' }} />

      <ScrollView contentContainerStyle={styles.content}>
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          {/* 16:9 Clean Light Thumbnail Card */}
          <Card padded={false} style={styles.heroCard}>
            <View style={styles.thumbnailWrapper}>
              {course.thumbnailUrl ? (
                <Image
                  source={{ uri: course.thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderThumbnail}>
                  <Ionicons name="book-outline" size={44} color={semantic.brandPrimary} />
                </View>
              )}
            </View>

            <View style={styles.headerBody}>
              <View style={styles.kickerRow}>
                {course.categoryName ? (
                  <Badge label={course.categoryName} variant="info" />
                ) : (
                  <View />
                )}
                {isLoggedIn && (
                  <TouchableOpacity
                    style={styles.writeReviewBtn}
                    onPress={() => router.push(`/courses/${slug}/write-review` as const)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="create-outline" size={14} color={semantic.brandPrimary} />
                    <Text style={styles.writeReviewText}>Viết đánh giá</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text variant="h1" style={styles.courseTitle}>
                {course.title}
              </Text>

              {/* Flat Metrics Strip */}
              <View style={styles.metricsStrip}>
                <TouchableOpacity
                  style={styles.metricCell}
                  onPress={() => router.push(`/courses/${slug}/reviews` as const)}
                  accessibilityRole="button"
                  accessibilityLabel="Xem đánh giá khóa học"
                >
                  <View style={styles.metricValueRow}>
                    <Ionicons name="star" size={15} color={semantic.ratingStar} />
                    <Text style={styles.metricValue}>
                      {course.averageRating ? course.averageRating.toFixed(1) : '5.0'}
                    </Text>
                  </View>
                  <Text style={styles.metricLabelLink}>
                    {course.ratingCount || 0} đánh giá →
                  </Text>
                </TouchableOpacity>

                <View style={styles.metricDivider} />

                <View style={styles.metricCell}>
                  <Text style={styles.metricValue}>{course.totalLessons || 0}</Text>
                  <Text style={styles.metricLabel}>Bài giảng</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricCell}>
                  <Text style={styles.metricValue}>
                    {totalMinutes > 0 ? `${totalMinutes} phút` : 'HD'}
                  </Text>
                  <Text style={styles.metricLabel}>Thời lượng</Text>
                </View>
              </View>

              {/* Instructor Strip */}
              <View style={styles.instructorRow}>
                <View style={styles.instructorIconBox}>
                  <Ionicons name="person-outline" size={18} color={semantic.brandPrimary} />
                </View>
                <View style={styles.instructorInfo}>
                  <Text variant="caption" style={styles.instructorLabel}>
                    Giảng viên chính
                  </Text>
                  <Text style={styles.instructorName}>
                    {course.mainInstructor?.fullName || course.instructorName || 'Giảng viên Edumy'}
                  </Text>
                  {course.coInstructors && course.coInstructors.length > 0 && (
                    <Text style={styles.coInstructorsText}>
                      Đồng giảng viên: {course.coInstructors.map((c) => c.fullName).join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Card>

          {/* Course Description */}
          {Boolean(course.description) && (
            <Card style={styles.sectionCard}>
              <Text variant="overline" style={styles.sectionOverline}>
                Tổng quan nội dung
              </Text>
              <Text variant="h3" style={styles.sectionTitle}>
                Mô tả khóa học
              </Text>
              <Text variant="body" style={styles.descriptionText}>
                {course.description}
              </Text>
            </Card>
          )}

          {/* Curriculum */}
          <Card style={styles.sectionCard}>
            <Text variant="overline" style={styles.sectionOverline}>
              Chương trình học
            </Text>
            <Text variant="h3" style={styles.sectionTitle}>
              Đề cương bài giảng
            </Text>

            {course.chapters && course.chapters.length > 0 ? (
              <View style={styles.chaptersWrap}>
                {course.chapters.map((chapter, chapterIdx) => (
                  <View key={chapter.id} style={styles.chapterBlock}>
                    <View style={styles.chapterHeader}>
                      <Text style={styles.chapterIndex}>
                        Chương {String(chapterIdx + 1).padStart(2, '0')}
                      </Text>
                      <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    </View>

                    <View style={styles.lessonList}>
                      {(chapter.lessons ?? []).map((lesson, lessonIdx) => (
                        <View key={lesson.id} style={styles.lessonRow}>
                          <View style={styles.lessonLeft}>
                            <Text style={styles.lessonNumber}>
                              {String(chapterIdx + 1).padStart(2, '0')}.
                              {String(lessonIdx + 1).padStart(2, '0')}
                            </Text>
                            <Ionicons
                              name={
                                lesson.contentType === 'video'
                                  ? 'videocam-outline'
                                  : 'document-text-outline'
                              }
                              size={16}
                              color={semantic.textMuted}
                            />
                            <Text style={styles.lessonTitle} numberOfLines={2}>
                              {lesson.title}
                            </Text>
                          </View>

                          {lesson.isPreview ? (
                            <TouchableOpacity
                              style={styles.previewBadge}
                              onPress={() => {
                                showInterstitialIfReady(() => {
                                  router.push(`/courses/${slug}/preview/${lesson.id}` as const);
                                });
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={`Học thử bài ${lesson.title}`}
                            >
                              <Ionicons name="play-outline" size={12} color={semantic.brandPrimary} />
                              <Text style={styles.previewText}>Học thử</Text>
                            </TouchableOpacity>
                          ) : (
                            <Ionicons
                              name="lock-closed-outline"
                              size={15}
                              color={semantic.textPlaceholder}
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text variant="bodySmall">Nội dung bài học đang được cập nhật.</Text>
            )}
          </Card>

          <AdBanner />
        </ResponsiveContainer>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          <View style={styles.bottomBarInner}>
            <View style={styles.priceContainer}>
              <Text variant="caption" style={styles.priceLabel}>
                Học phí
              </Text>
              <MoneyText amount={course.isFree ? 0 : (course.price ?? 0)} style={styles.priceText} />
            </View>

            <View style={styles.actionButtonsContainer}>
              {actionState.primaryLabel ? (
                <Button
                  title={actionState.primaryLabel}
                  onPress={handlePrimaryAction}
                  loading={isEnrolling}
                  disabled={isEnrolling}
                  style={styles.primaryActionButton}
                />
              ) : actionState.notice ? (
                <Badge label={actionState.notice} variant="info" />
              ) : null}
            </View>
          </View>
        </ResponsiveContainer>
      </View>
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
    paddingBottom: 112,
  },
  heroCard: {
    overflow: 'hidden',
    marginBottom: 14,
  },
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: semantic.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.surfaceMuted,
  },
  headerBody: {
    padding: 16,
  },
  kickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 36,
    borderRadius: radius.btn,
  },
  writeReviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: semantic.brandPrimary,
  },
  courseTitle: {
    fontSize: 21,
    lineHeight: 28,
    marginBottom: 14,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.surfaceCanvas,
    borderRadius: radius.btn,
    paddingVertical: 10,
    marginBottom: 14,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: semantic.borderSubtle,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontFamily: monoFontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 11,
    color: semantic.textMuted,
    marginTop: 2,
  },
  metricLabelLink: {
    fontSize: 11,
    fontWeight: '600',
    color: semantic.brandPrimary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: semantic.surfaceMuted,
  },
  instructorIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.btn,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructorInfo: {
    flex: 1,
  },
  instructorLabel: {
    color: semantic.textMuted,
  },
  instructorName: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
    marginTop: 1,
  },
  coInstructorsText: {
    fontSize: 12,
    color: semantic.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: 14,
  },
  sectionOverline: {
    color: semantic.brandPrimary,
    marginBottom: 4,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  descriptionText: {
    color: semantic.textBody,
    lineHeight: 23,
  },
  chaptersWrap: {
    gap: 12,
  },
  chapterBlock: {
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    borderRadius: radius.btn,
    overflow: 'hidden',
  },
  chapterHeader: {
    backgroundColor: semantic.surfaceCanvas,
    paddingHorizontal: 12,
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
    fontWeight: '700',
    fontSize: 14,
    color: semantic.textPrimary,
  },
  lessonList: {
    paddingHorizontal: 12,
    backgroundColor: semantic.surfaceCard,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: semantic.surfaceMuted,
    gap: 8,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  lessonNumber: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
    minWidth: 34,
  },
  lessonTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: semantic.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
    backgroundColor: semantic.brandSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
  },
  previewText: {
    color: semantic.brandPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: semantic.surfacePage,
    borderTopWidth: 1,
    borderTopColor: semantic.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    color: semantic.textMuted,
    marginBottom: 2,
  },
  priceText: {
    fontSize: 18,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  primaryActionButton: {
    minHeight: 44,
    paddingHorizontal: 18,
  },
});
