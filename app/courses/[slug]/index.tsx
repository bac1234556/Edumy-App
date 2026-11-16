// app/courses/[slug]/index.tsx — Chi tiết khóa học (Swiss Editorial Magazine Layout)
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCourseDetail, useFreeEnroll, useAddToCart } from '../../../src/features/catalog/hooks';
import { resolveCourseAction } from '../../../src/features/catalog/logic';
import { useSessionStore } from '../../../src/store/session';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { MoneyText } from '../../../src/components/ui/MoneyText';
import { webLinks } from '../../../src/lib/web-links';
import { AppError } from '../../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';
import { semantic, radius, monoFontFamily } from '../../../src/theme/tokens';

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  const { data: course, isLoading, isError, error, refetch } = useCourseDetail(slug);
  const { mutate: freeEnroll, isPending: isEnrolling } = useFreeEnroll(slug);
  const { mutate: addToCart, isPending: isAddingCart } = useAddToCart(slug);

  if (isLoading) {
    return <Loading message="Đang tải hồ sơ khóa học..." />;
  }

  if (isError || !course) {
    return (
      <ErrorState
        message={error?.message || 'Không tìm thấy thông tin khóa học.'}
        onRetry={() => refetch()}
      />
    );
  }

  const actionState = resolveCourseAction({
    isLoggedIn,
    isFree: course.isFree,
    viewer: course.viewer,
  });

  const handlePrimaryAction = () => {
    switch (actionState.primaryAction) {
      case 'LOGIN_TO_LEARN':
        router.push('/(auth)/login');
        break;
      case 'OPEN_LEARNING':
        router.push(`/learn/${course.id}` as const);
        break;
      case 'FREE_ENROLL':
        freeEnroll(course.id, {
          onSuccess: () => {
            router.push(`/learn/${course.id}` as const);
          },
          onError: (err) => {
            const appErr = err as unknown as AppError;
            Alert.alert('Không thể ghi danh', appErr.message || 'Vui lòng thử lại sau.');
          },
        });
        break;
      case 'ALREADY_IN_CART':
        router.push('/(tabs)/cart');
        break;
      case 'ADD_TO_CART':
        addToCart(course.id, {
          onError: (err) => {
            const appErr = err as unknown as AppError;
            Alert.alert('Giỏ hàng', appErr.message || 'Không thể thêm vào giỏ.');
          },
        });
        break;
      default:
        break;
    }
  };

  const handleOpenWebsite = () => {
    Linking.openURL(webLinks.course(slug));
  };

  const totalMinutes = course.totalDurationSeconds
    ? Math.max(1, Math.ceil(course.totalDurationSeconds / 60))
    : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: course.title, headerBackTitle: 'Quay lại' }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* 16:9 Framed Thumbnail */}
        <View style={styles.thumbnailWrapper}>
          {course.thumbnailUrl ? (
            <Image source={{ uri: course.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Ionicons name="layers-outline" size={48} color={semantic.brandPrimary} />
            </View>
          )}
        </View>

        {/* Editorial Header Card */}
        <View style={styles.headerSection}>
          <View style={styles.kickerRow}>
            {course.categoryName && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{course.categoryName.toUpperCase()}</Text>
              </View>
            )}
            {isLoggedIn && (
              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() => router.push(`/courses/${slug}/write-review` as const)}
              >
                <Ionicons name="create-outline" size={13} color={semantic.brandPrimary} />
                <Text style={styles.writeReviewText}>Viết đánh giá</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text variant="h1" style={styles.courseTitle}>
            {course.title}
          </Text>

          {/* 3-Column Bento Metrics Strip */}
          <View style={styles.metricsBento}>
            <TouchableOpacity
              style={styles.metricCell}
              onPress={() => router.push(`/courses/${slug}/reviews` as const)}
            >
              <View style={styles.metricValueRow}>
                <Ionicons name="star" size={14} color="#D97706" />
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
                {totalMinutes > 0 ? `${totalMinutes}p` : 'Chuẩn HD'}
              </Text>
              <Text style={styles.metricLabel}>Thời lượng</Text>
            </View>
          </View>

          {/* Instructor Block */}
          <View style={styles.instructorCard}>
            <View style={styles.instructorIconBox}>
              <Ionicons name="person-outline" size={18} color={semantic.brandPrimary} />
            </View>
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorLabel}>GIẢNG VIÊN CHÍNH</Text>
              <Text style={styles.instructorName}>{course.mainInstructor.fullName}</Text>
              {course.coInstructors && course.coInstructors.length > 0 && (
                <Text style={styles.coInstructorsText}>
                  Đồng giảng viên: {course.coInstructors.map((c) => c.fullName).join(', ')}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Course Description */}
        {course.description && (
          <View style={styles.section}>
            <Text style={styles.sectionOverline}>TỔNG QUAN NỘI DUNG</Text>
            <Text variant="h3" style={styles.sectionTitle}>
              Mô tả chuyên môn
            </Text>
            <Text variant="body" style={styles.descriptionText}>
              {course.description}
            </Text>
          </View>
        )}

        {/* Technical Boxed Curriculum Section */}
        <View style={styles.section}>
          <Text style={styles.sectionOverline}>CẤU TRÚC CHƯƠNG TRÌNH</Text>
          <Text variant="h3" style={styles.sectionTitle}>
            Đề cương bài giảng
          </Text>

          {course.chapters && course.chapters.length > 0 ? (
            course.chapters.map((chapter, chapterIdx) => (
              <View key={chapter.id} style={styles.chapterCard}>
                <View style={styles.chapterHeader}>
                  <Text style={styles.chapterIndex}>
                    CHƯƠNG {String(chapterIdx + 1).padStart(2, '0')}
                  </Text>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                </View>

                <View style={styles.lessonList}>
                  {chapter.lessons.map((lesson, lessonIdx) => (
                    <View key={lesson.id} style={styles.lessonRow}>
                      <View style={styles.lessonLeft}>
                        <Text style={styles.lessonNumber}>
                          {String(chapterIdx + 1).padStart(2, '0')}.{String(lessonIdx + 1).padStart(2, '0')}
                        </Text>
                        <Ionicons
                          name={lesson.contentType === 'video' ? 'videocam-outline' : 'document-text-outline'}
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
                          onPress={() => router.push(`/courses/${slug}/preview/${lesson.id}` as const)}
                        >
                          <Ionicons name="play-outline" size={12} color={semantic.brandPrimary} />
                          <Text style={styles.previewText}>Học thử</Text>
                        </TouchableOpacity>
                      ) : (
                        <Ionicons name="lock-closed-outline" size={15} color="#94A3B8" />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <Text variant="bodySmall">Nội dung bài học đang được cập nhật.</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar (Table D-M02) */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceOverline}>HỌC PHÍ NIÊM YẾT</Text>
          <MoneyText amount={course.isFree ? 0 : course.price} style={styles.priceText} />
        </View>

        <View style={styles.actionButtonsContainer}>
          {actionState.primaryLabel && (
            <Button
              title={actionState.primaryLabel}
              onPress={handlePrimaryAction}
              loading={isEnrolling || isAddingCart}
              style={styles.primaryActionButton}
            />
          )}

          {actionState.secondaryLabel && (
            <Button
              title={actionState.secondaryLabel}
              variant="outline"
              onPress={handleOpenWebsite}
              style={styles.secondaryActionButton}
            />
          )}
        </View>
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
    paddingBottom: 110,
  },
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0B0F17',
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
    backgroundColor: semantic.surfaceSubtle,
  },
  headerSection: {
    backgroundColor: semantic.surfaceCard,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
  },
  kickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    color: semantic.brandPrimaryStrong,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: semantic.surfaceCanvas,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  writeReviewText: {
    fontSize: 11,
    fontWeight: '700',
    color: semantic.brandPrimary,
  },
  courseTitle: {
    fontSize: 21,
    lineHeight: 27,
    marginBottom: 14,
  },
  metricsBento: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.surfaceCanvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
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
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: semantic.surfaceCanvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  instructorIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
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
    fontSize: 10,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.7,
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
  section: {
    backgroundColor: semantic.surfaceCard,
    marginTop: 12,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  sectionOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimary,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  descriptionText: {
    color: '#334155',
    lineHeight: 23,
  },
  chapterCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    borderRadius: radius.md,
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
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimary,
    letterSpacing: 0.7,
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
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: semantic.brandSoft,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
  },
  previewText: {
    color: semantic.brandPrimaryStrong,
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: semantic.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: semantic.borderStrong,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flex: 1,
  },
  priceOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.7,
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
  secondaryActionButton: {
    minHeight: 44,
    paddingHorizontal: 14,
  },
});
