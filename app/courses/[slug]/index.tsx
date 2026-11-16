// app/courses/[slug]/index.tsx — Chi tiết khóa học
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

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  const { data: course, isLoading, isError, error, refetch } = useCourseDetail(slug);
  const { mutate: freeEnroll, isPending: isEnrolling } = useFreeEnroll(slug);
  const { mutate: addToCart, isPending: isAddingCart } = useAddToCart(slug);

  if (isLoading) {
    return <Loading message="Đang tải thông tin khóa học..." />;
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: course.title, headerBackTitle: 'Quay lại' }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Course Thumbnail */}
        <View style={styles.thumbnailWrapper}>
          {course.thumbnailUrl ? (
            <Image source={{ uri: course.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Ionicons name="school-outline" size={54} color="#0D9488" />
            </View>
          )}
        </View>

        {/* Title & Metadata */}
        <View style={styles.headerSection}>
          {course.categoryName && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{course.categoryName.toUpperCase()}</Text>
            </View>
          )}

          <Text variant="h1" style={styles.courseTitle}>
            {course.title}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.statScore}>
                {course.averageRating ? course.averageRating.toFixed(1) : '5.0'}
              </Text>
              <TouchableOpacity onPress={() => router.push(`/courses/${slug}/reviews` as const)}>
                <Text style={styles.reviewsLink}>({course.ratingCount || 0} đánh giá)</Text>
              </TouchableOpacity>
            </View>

            {Boolean(course.totalLessons) && (
              <View style={styles.statItem}>
                <Ionicons name="play-circle-outline" size={16} color="#64748B" />
                <Text style={styles.statText}>{course.totalLessons} bài giảng</Text>
              </View>
            )}
          </View>

          {/* Instructors */}
          <View style={styles.instructorSection}>
            <Ionicons name="person-circle-outline" size={24} color="#0D9488" />
            <Text style={styles.instructorText}>
              Giảng viên: <Text style={styles.instructorName}>{course.mainInstructor.fullName}</Text>
            </Text>
          </View>
        </View>

        {/* Course Description */}
        {course.description && (
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Mô tả khóa học
            </Text>
            <Text variant="body" style={styles.descriptionText}>
              {course.description}
            </Text>
          </View>
        )}

        {/* Curriculum Section */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Đề cương khóa học
          </Text>

          {course.chapters && course.chapters.length > 0 ? (
            course.chapters.map((chapter, chapterIdx) => (
              <View key={chapter.id} style={styles.chapterCard}>
                <Text style={styles.chapterTitle}>
                  Chương {chapterIdx + 1}: {chapter.title}
                </Text>

                <View style={styles.lessonList}>
                  {chapter.lessons.map((lesson, lessonIdx) => (
                    <View key={lesson.id} style={styles.lessonRow}>
                      <View style={styles.lessonLeft}>
                        <Ionicons
                          name={lesson.contentType === 'video' ? 'videocam-outline' : 'document-text-outline'}
                          size={18}
                          color="#64748B"
                        />
                        <Text style={styles.lessonTitle}>
                          {chapterIdx + 1}.{lessonIdx + 1} {lesson.title}
                        </Text>
                      </View>

                      {lesson.isPreview ? (
                        <TouchableOpacity
                          style={styles.previewBadge}
                          onPress={() => router.push(`/courses/${slug}/preview/${lesson.id}` as const)}
                        >
                          <Ionicons name="eye-outline" size={13} color="#0D9488" />
                          <Text style={styles.previewText}>Xem trước</Text>
                        </TouchableOpacity>
                      ) : (
                        <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
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

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text variant="caption">Học phí</Text>
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
    backgroundColor: '#FAF9F6',
  },
  content: {
    paddingBottom: 100,
  },
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0F172A',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
  },
  headerSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  reviewsLink: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '600',
  },
  statText: {
    fontSize: 13,
    color: '#64748B',
  },
  instructorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  instructorText: {
    fontSize: 14,
    color: '#64748B',
  },
  instructorName: {
    fontWeight: '700',
    color: '#0F172A',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  descriptionText: {
    color: '#334155',
    lineHeight: 24,
  },
  chapterCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  chapterTitle: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    fontWeight: '700',
    fontSize: 14,
    color: '#0F172A',
  },
  lessonList: {
    paddingHorizontal: 12,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F0FDFA',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  previewText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  priceContainer: {
    flex: 1,
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
