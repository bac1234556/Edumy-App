// app/courses/[slug]/write-review.tsx — Gửi / Cập nhật / Rút đánh giá khóa học
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { confirm, notify } from '../../../src/lib/dialog';
import { useCourseDetail, useCourseReviews } from '../../../src/features/catalog/hooks';
import {
  useDeleteReview,
  useSubmitReview,
  useUpdateReview,
} from '../../../src/features/reviews/hooks';
import { isReviewHiddenError, validateReviewInput } from '../../../src/features/reviews/logic';
import { useSessionStore } from '../../../src/store/session';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ResponsiveContainer } from '../../../src/components/ui/ResponsiveContainer';
import { AppError } from '../../../src/api/problem';
import { layout, radius, semantic } from '../../../src/theme/tokens';

export default function WriteReviewScreen() {
  const { slug, reviewId: paramReviewId } = useLocalSearchParams<{
    slug: string;
    reviewId?: string;
  }>();
  const router = useRouter();
  const { me } = useSessionStore();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const { data: course, isLoading, isError, error, refetch } = useCourseDetail(slug || '');
  const { data: reviewsPage } = useCourseReviews(slug || '', 0);
  const { mutate: submitReview, isPending: isSubmitting } = useSubmitReview(slug);
  const { mutate: updateReview, isPending: isUpdating } = useUpdateReview(slug);
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteReview(slug);

  const existingReview = useMemo(() => {
    const list = reviewsPage?.content ?? [];
    if (paramReviewId) {
      const byId = list.find((r) => String(r.id) === String(paramReviewId));
      if (byId) return byId;
    }
    if (!me?.fullName) return undefined;
    return list.find((r) => r.reviewerName === me.fullName);
  }, [reviewsPage?.content, paramReviewId, me?.fullName]);

  const resolvedReviewId = existingReview?.id ?? (paramReviewId ? Number(paramReviewId) : undefined);

  useEffect(() => {
    if (existingReview && !hasPrefilled) {
      setRating(existingReview.rating ?? 5);
      setComment(existingReview.comment ?? '');
      setHasPrefilled(true);
    }
  }, [existingReview, hasPrefilled]);

  if (isLoading) {
    return <Loading message="Đang tải thông tin khóa học..." />;
  }

  if (isError || !course) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Đánh giá khóa học', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          error={error}
          message={error?.message || 'Không tìm thấy thông tin khóa học.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const handleMutationError = (err: unknown) => {
    const appErr = err as unknown as AppError;
    if (isReviewHiddenError(appErr, Boolean(existingReview))) {
      setErrorMessage(
        'Đánh giá của bạn đối với khóa học này đã bị quản trị viên ẩn và không thể chỉnh sửa.'
      );
    } else {
      setErrorMessage(appErr.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
    }
  };

  const handleSubmit = () => {
    const val = validateReviewInput(rating, comment);
    if (!val.valid) {
      setErrorMessage(val.message || 'Dữ liệu đánh giá không hợp lệ.');
      return;
    }

    if (!course.id) return;
    const payload = {
      rating,
      comment: comment.trim() || undefined,
    };

    if (resolvedReviewId) {
      updateReview(
        {
          reviewId: resolvedReviewId,
          input: payload,
        },
        {
          onSuccess: async () => {
            await notify('Thành công', 'Đã cập nhật đánh giá của bạn cho khóa học này!');
            router.back();
          },
          onError: handleMutationError,
        }
      );
      return;
    }

    submitReview(
      {
        courseId: course.id,
        input: payload,
      },
      {
        onSuccess: async () => {
          await notify('Thành công', 'Cảm ơn bạn đã gửi đánh giá cho khóa học này!');
          router.back();
        },
        onError: handleMutationError,
      }
    );
  };

  const handleWithdraw = async () => {
    if (!resolvedReviewId) return;
    const confirmed = await confirm({
      title: 'Rút đánh giá',
      message: 'Bạn có chắc chắn muốn xóa đánh giá của mình khỏi khóa học này?',
      confirmText: 'Xóa đánh giá',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (!confirmed) return;

    deleteReview(resolvedReviewId, {
      onSuccess: async () => {
        await notify('Đã xóa', 'Đánh giá của bạn đã được rút khỏi khóa học.');
        router.back();
      },
      onError: handleMutationError,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Đánh giá khóa học',
          headerBackTitle: 'Quay lại',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer maxWidth={layout.maxReadingWidth}>
          <Card style={styles.courseHeader}>
            <Text variant="overline" style={styles.courseHeaderLabel}>
              Khóa học
            </Text>
            <Text variant="h2" style={styles.courseTitle}>
              {course.title}
            </Text>
          </Card>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={semantic.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Rating Stars Selection */}
          <Card style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Mức độ hài lòng của bạn</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setRating(star);
                    setErrorMessage(null);
                  }}
                  style={styles.starTouch}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Đánh giá ${star} sao`}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= rating ? semantic.ratingStar : semantic.borderStrong}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingDesc}>
              {rating === 5 && 'Tuyệt vời — Rất đáng học'}
              {rating === 4 && 'Tốt — Hài lòng với nội dung'}
              {rating === 3 && 'Bình thường — Cần cải thiện'}
              {rating === 2 && 'Chưa tốt — Thiếu nhiều nội dung'}
              {rating === 1 && 'Rất tệ — Không hài lòng'}
            </Text>
          </Card>

          {/* Comment Input */}
          <Card style={styles.commentSection}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentLabel}>Lời bình / Góp ý (tùy chọn)</Text>
              <Text style={styles.counterText}>{comment.length}/2000</Text>
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Chia sẻ trải nghiệm học tập, chất lượng bài giảng..."
              placeholderTextColor={semantic.textPlaceholder}
              value={comment}
              onChangeText={(t) => {
                setComment(t);
                setErrorMessage(null);
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
          </Card>

          <Button
            title={resolvedReviewId ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            onPress={handleSubmit}
            loading={isSubmitting || isUpdating}
            disabled={isSubmitting || isUpdating || isDeleting}
          />
          {Boolean(resolvedReviewId) && (
            <Button
              title="Rút đánh giá"
              variant="outline"
              onPress={handleWithdraw}
              loading={isDeleting}
              disabled={isSubmitting || isUpdating || isDeleting}
              style={{ marginTop: 10 }}
            />
          )}
        </ResponsiveContainer>
      </ScrollView>
    </KeyboardAvoidingView>
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
  courseHeader: {
    marginBottom: 14,
  },
  courseHeaderLabel: {
    color: semantic.brandPrimary,
  },
  courseTitle: {
    color: semantic.textPrimary,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.dangerSoft,
    borderWidth: 1,
    borderColor: semantic.dangerBorder,
    padding: 12,
    borderRadius: radius.btn,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: semantic.danger,
    flex: 1,
    lineHeight: 18,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 20,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: semantic.textPrimary,
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  starTouch: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: semantic.brandPrimary,
  },
  commentSection: {
    marginBottom: 18,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  counterText: {
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  commentInput: {
    backgroundColor: semantic.surfaceCanvas,
    borderWidth: 1,
    borderColor: semantic.borderStrong,
    borderRadius: radius.input,
    padding: 12,
    fontSize: 14,
    color: semantic.textPrimary,
    minHeight: 120,
  },
});
