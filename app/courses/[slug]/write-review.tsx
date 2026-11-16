// app/courses/[slug]/write-review.tsx — Gửi đánh giá khóa học
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCourseDetail } from '../../../src/features/catalog/hooks';
import { useSubmitReview } from '../../../src/features/reviews/hooks';
import { validateReviewInput } from '../../../src/features/reviews/logic';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { AppError } from '../../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';

export default function WriteReviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: course, isLoading, isError, error, refetch } = useCourseDetail(slug || '');
  const { mutate: submitReview, isPending: isSubmitting } = useSubmitReview(slug);

  if (isLoading) {
    return <Loading message="Đang tải thông tin khóa học..." />;
  }

  if (isError || !course) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Đánh giá khóa học', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          message={error?.message || 'Không tìm thấy thông tin khóa học.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const handleSubmit = () => {
    const val = validateReviewInput(rating, comment);
    if (!val.valid) {
      setErrorMessage(val.message || 'Dữ liệu đánh giá không hợp lệ.');
      return;
    }

    submitReview(
      {
        courseId: course.id,
        input: {
          rating,
          comment: comment.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Thành công', 'Cảm ơn bạn đã gửi đánh giá cho khóa học này!', [
            { text: 'Đồng ý', onPress: () => router.back() },
          ]);
        },
        onError: (err) => {
          const appErr = err as unknown as AppError;
          if (appErr.code === 'REVIEW_HIDDEN_BY_ADMIN' || appErr.status === 409) {
            setErrorMessage('Đánh giá của bạn đối với khóa học này đã bị quản trị viên ẩn.');
          } else {
            setErrorMessage(appErr.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
          }
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Đánh giá khóa học',
          headerBackTitle: 'Quay lại',
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.courseHeader}>
          <Text variant="caption" style={styles.courseHeaderLabel}>
            Khóa học
          </Text>
          <Text variant="h2" style={styles.courseTitle}>
            {course.title}
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Rating Stars Selection */}
        <View style={styles.ratingSection}>
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
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingDesc}>
            {rating === 5 && 'Tuyệt vời — Rất đáng học'}
            {rating === 4 && 'Tốt — Hài lòng với nội dung'}
            {rating === 3 && 'Bình thường — Cần cải thiện'}
            {rating === 2 && 'Chưa tốt — Thiếu nhiều nội dung'}
            {rating === 1 && 'Rất tệ — Thất vọng'}
          </Text>
        </View>

        {/* Comment Input */}
        <View style={styles.commentSection}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentLabel}>Lời bình / Góp ý (tùy chọn)</Text>
            <Text style={styles.counterText}>{comment.length}/2000</Text>
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Chia sẻ trải nghiệm học tập, sự tận tâm của giảng viên hoặc chất lượng bài tập..."
            placeholderTextColor="#94A3B8"
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
        </View>

        <Button
          title="Gửi đánh giá"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.submitBtn}
        />
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
    padding: 20,
    paddingBottom: 40,
  },
  courseHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  courseHeaderLabel: {
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseTitle: {
    color: '#0F172A',
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  ratingSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  starTouch: {
    padding: 4,
  },
  ratingDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0D9488',
  },
  commentSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
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
    color: '#0F172A',
  },
  counterText: {
    fontSize: 12,
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 120,
  },
  submitBtn: {
    backgroundColor: '#0D9488',
  },
});
