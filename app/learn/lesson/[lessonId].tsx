// app/learn/lesson/[lessonId].tsx — Trình học bài giảng (Modern Dark Cinema & D-33 Manual Completion)
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  useLessonDetail,
  useRecordLessonVisit,
  useSetLessonCompletion,
} from '../../../src/features/learning/hooks';
import { LessonContentViewer } from '../../../src/components/media/LessonContentViewer';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { AppError } from '../../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';
import { semantic, radius, monoFontFamily } from '../../../src/theme/tokens';

export default function LessonLearnScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const numericLessonId = Number(lessonId);
  const router = useRouter();

  const { data: lesson, isLoading, isError, error, refetch } = useLessonDetail(numericLessonId);
  const { mutate: recordVisit } = useRecordLessonVisit();
  const { mutate: setCompletion, isPending: isUpdatingCompletion } = useSetLessonCompletion(
    lesson?.courseId
  );

  const hasRecordedVisit = useRef(false);

  // D-34: Record visit once per open
  useEffect(() => {
    if (numericLessonId && !hasRecordedVisit.current) {
      hasRecordedVisit.current = true;
      recordVisit(numericLessonId);
    }
  }, [numericLessonId, recordVisit]);

  if (isLoading) {
    return <Loading message="Đang khởi tạo phòng học..." />;
  }

  if (isError || !lesson) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Bài giảng', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          message={error?.message || 'Không thể tải nội dung bài học.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const isCompleted = Boolean(lesson.completed);

  const handleToggleCompletion = () => {
    const nextCompleted = !isCompleted;

    setCompletion(
      { lessonId: numericLessonId, completed: nextCompleted },
      {
        onSuccess: (data) => {
          if (data.certificateIssued) {
            Alert.alert(
              'Hoàn thành khóa học',
              'Chúc mừng bạn đã hoàn tất 100% chương trình học và được cấp chứng chỉ tốt nghiệp xác thực từ Edumy.',
              [
                { text: 'Đóng', style: 'default' },
                {
                  text: 'Xem chứng chỉ',
                  onPress: () => router.push('/account/certificates' as const),
                },
              ]
            );
          }
        },
        onError: (err) => {
          const appErr = err as unknown as AppError;
          Alert.alert('Lỗi cập nhật', appErr.message || 'Không thể cập nhật tiến độ bài học.');
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: lesson.title,
          headerBackTitle: 'Đề cương',
        }}
      />

      {/* Modern Dark Cinema Media/Article Viewer */}
      <LessonContentViewer
        contentType={lesson.contentType}
        videoUrl={lesson.videoUrl}
        articleContent={lesson.articleContent}
        title={lesson.title}
      />

      {/* Editorial Control & Completion Panel */}
      <ScrollView contentContainerStyle={styles.infoScroll}>
        <View style={styles.headerCard}>
          <View style={styles.metaRow}>
            <View style={styles.typeBadge}>
              <Ionicons
                name={
                  lesson.contentType === 'video'
                    ? 'videocam-outline'
                    : 'document-text-outline'
                }
                size={13}
                color={semantic.brandPrimaryStrong}
              />
              <Text style={styles.typeBadgeText}>
                {lesson.contentType === 'video' ? 'VIDEO BÀI GIẢNG' : 'TÀI LIỆU BÀI ĐỌC'}
              </Text>
            </View>

            {Boolean(lesson.durationSeconds) && (
              <Text style={styles.durationText}>
                {Math.ceil((lesson.durationSeconds || 0) / 60)} PHÚT
              </Text>
            )}
          </View>

          <Text variant="h2" style={styles.lessonTitle}>
            {lesson.title}
          </Text>
        </View>

        {/* Completion Action Box (Rule D-33 Manual Toggle) */}
        <View style={[styles.completionBox, isCompleted && styles.completionBoxActive]}>
          <View style={styles.completionHeader}>
            <View style={[styles.statusIconWrap, isCompleted ? styles.statusIconDone : styles.statusIconPending]}>
              <Ionicons
                name={isCompleted ? 'checkmark-outline' : 'hourglass-outline'}
                size={20}
                color={isCompleted ? semantic.success : semantic.accentAmber}
              />
            </View>
            <View style={styles.completionHeaderText}>
              <Text style={styles.completionOverline}>
                TRẠNG THÁI GHI NHẬN // QUY TẮC D-33
              </Text>
              <Text style={styles.completionStatusTitle}>
                {isCompleted ? 'Đã hoàn thành bài học này' : 'Chưa đánh dấu hoàn thành'}
              </Text>
              <Text style={styles.completionStatusDesc}>
                {isCompleted
                  ? 'Tiến độ bài giảng đã được đồng bộ lên máy chủ và tính vào điều kiện cấp chứng chỉ.'
                  : 'Xác nhận hoàn thành thủ công sau khi bạn đã nắm vững nội dung bài giảng.'}
              </Text>
            </View>
          </View>

          <Button
            title={isCompleted ? 'Bỏ đánh dấu hoàn thành' : 'Xác nhận hoàn thành bài học'}
            variant={isCompleted ? 'outline' : 'primary'}
            onPress={handleToggleCompletion}
            loading={isUpdatingCompletion}
            disabled={isUpdatingCompletion}
            style={styles.toggleButton}
          />
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
  infoScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 16,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
    letterSpacing: 0.6,
  },
  durationText: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  lessonTitle: {
    fontSize: 19,
    lineHeight: 25,
    color: semantic.textPrimary,
  },
  completionBox: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  completionBoxActive: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusIconDone: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusIconPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  completionHeaderText: {
    flex: 1,
  },
  completionOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  completionStatusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: semantic.textPrimary,
    marginBottom: 4,
  },
  completionStatusDesc: {
    fontSize: 13,
    color: semantic.textSecondary,
    lineHeight: 19,
  },
  toggleButton: {
    width: '100%',
  },
});
