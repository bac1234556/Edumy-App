// app/learn/lesson/[lessonId].tsx — Trình học bài giảng (Video/Article & Manual completion)
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
    return <Loading message="Đang tải bài học..." />;
  }

  if (isError || !lesson) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Bài học', headerBackTitle: 'Quay lại' }} />
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
              '🎉 Xuất sắc!',
              'Chúc mừng bạn đã hoàn thành tất cả bài học trong khóa và nhận được chứng chỉ tốt nghiệp!',
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

      {/* Main Media/Article View */}
      <LessonContentViewer
        contentType={lesson.contentType}
        videoUrl={lesson.videoUrl}
        articleContent={lesson.articleContent}
        title={lesson.title}
      />

      {/* Action and Info Section */}
      <ScrollView contentContainerStyle={styles.infoScroll}>
        <View style={styles.headerInfo}>
          <Text variant="h2" style={styles.lessonTitle}>
            {lesson.title}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.typeBadge}>
              <Ionicons
                name={
                  lesson.contentType === 'video'
                    ? 'videocam-outline'
                    : 'document-text-outline'
                }
                size={14}
                color="#0D9488"
              />
              <Text style={styles.typeBadgeText}>
                {lesson.contentType === 'video' ? 'Video bài giảng' : 'Tài liệu bài đọc'}
              </Text>
            </View>

            {Boolean(lesson.durationSeconds) && (
              <Text style={styles.durationText}>
                {Math.ceil((lesson.durationSeconds || 0) / 60)} phút
              </Text>
            )}
          </View>
        </View>

        {/* Completion Action Box (D-33 Manual Toggle) */}
        <View style={styles.completionBox}>
          <View style={styles.completionHeader}>
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'time-outline'}
              size={24}
              color={isCompleted ? '#059669' : '#D97706'}
            />
            <View style={styles.completionHeaderText}>
              <Text style={styles.completionStatusTitle}>
                {isCompleted ? 'Bạn đã hoàn thành bài học này' : 'Chưa đánh dấu hoàn thành'}
              </Text>
              <Text style={styles.completionStatusDesc}>
                {isCompleted
                  ? 'Tiến độ của bạn đã được ghi nhận vào chứng chỉ.'
                  : 'Hãy chọn nút bên dưới khi bạn đã xem và hiểu nội dung.'}
              </Text>
            </View>
          </View>

          <Button
            title={isCompleted ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
            variant={isCompleted ? 'outline' : 'primary'}
            onPress={handleToggleCompletion}
            loading={isUpdatingCompletion}
            style={styles.completionBtn}
          />
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
  infoScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  headerInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lessonTitle: {
    color: '#0F172A',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  durationText: {
    fontSize: 12,
    color: '#64748B',
  },
  completionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  completionHeaderText: {
    flex: 1,
  },
  completionStatusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  completionStatusDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  completionBtn: {
    marginTop: 4,
  },
});
