// app/learn/lesson/[lessonId].tsx — Trình học bài giảng (Prev/Next, Visit, Completion & Certificate)
import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useLessonDetail,
  useRecordLessonVisit,
  useSetLessonCompletion,
} from '../../../src/features/learning/hooks';
import { LessonContentViewer } from '../../../src/components/media/LessonContentViewer';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ResponsiveContainer } from '../../../src/components/ui/ResponsiveContainer';
import { AppError } from '../../../src/api/problem';
import { notify } from '../../../src/lib/dialog';
import { webLinks } from '../../../src/lib/web-links';
import { layout, monoFontFamily, radius, semantic } from '../../../src/theme/tokens';

export default function LessonLearnScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const numericLessonId = Number(lessonId);
  const router = useRouter();

  const { data: lesson, isLoading, isError, error, refetch } = useLessonDetail(numericLessonId);
  const { mutate: recordVisit } = useRecordLessonVisit();
  const { mutate: setCompletion, isPending: isUpdatingCompletion } = useSetLessonCompletion(
    lesson?.courseId
  );

  const lastVisitedLessonId = useRef<number | null>(null);
  const handledNotEnrolledRef = useRef<number | null>(null);
  const [issuedCertCode, setIssuedCertCode] = useState<string | null>(null);

  // D-34: Record visit once per opened lessonId
  useEffect(() => {
    if (numericLessonId && lastVisitedLessonId.current !== numericLessonId) {
      lastVisitedLessonId.current = numericLessonId;
      recordVisit(numericLessonId);
    }
  }, [numericLessonId, recordVisit]);

  // Handle 403 NOT_ENROLLED -> return to course/previous page with notice
  useEffect(() => {
    if (!isError || !error) return;
    const appErr = error as unknown as AppError;
    if (
      (appErr.status === 403 || appErr.code === 'NOT_ENROLLED') &&
      handledNotEnrolledRef.current !== numericLessonId
    ) {
      handledNotEnrolledRef.current = numericLessonId;
      void notify(
        'Chưa ghi danh khóa học',
        appErr.message || 'Bạn cần ghi danh khóa học để truy cập bài học này.'
      ).then(() => {
        router.back();
      });
    }
  }, [isError, error, numericLessonId, router]);

  if (isLoading) {
    return <Loading message="Đang khởi tạo phòng học..." />;
  }

  if (isError || !lesson) {
    const appErr = error as unknown as AppError | null;
    const isForbidden = appErr?.status === 403 || appErr?.code === 'NOT_ENROLLED';
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Bài giảng', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          error={error}
          icon={
            isForbidden ? (
              <Ionicons name="lock-closed-outline" size={26} color={semantic.warning} />
            ) : undefined
          }
          message={
            isForbidden
              ? appErr?.message || 'Bạn cần ghi danh khóa học để truy cập bài học này.'
              : error?.message || 'Không thể tải nội dung bài học.'
          }
          retryLabel={isForbidden ? 'Quay lại' : 'Thử lại'}
          onRetry={() => (isForbidden ? router.back() : refetch())}
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
          if (data.certificateJustIssued) {
            setIssuedCertCode(data.certificateCode ?? '');
          }
        },
        onError: (err) => {
          const appErr = err as unknown as AppError;
          if (appErr.status === 403 || appErr.code === 'NOT_ENROLLED') {
            void notify(
              'Chưa ghi danh khóa học',
              appErr.message || 'Bạn chưa ghi danh khóa học này.'
            ).then(() => router.back());
            return;
          }
          void notify('Lỗi cập nhật', appErr.message || 'Không thể cập nhật tiến độ bài học.');
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

      {/* Light-Mode Media/Article Viewer */}
      <LessonContentViewer
        contentType={lesson.contentType === 'video' ? 'video' : 'article'}
        videoUrl={lesson.videoUrl}
        articleContent={lesson.articleContent}
        title={lesson.title ?? ''}
        onOpenWebsite={
          lesson.courseId
            ? () => {
                void WebBrowser.openBrowserAsync(webLinks.course(lesson.courseId!));
              }
            : undefined
        }
      />

      {/* Editorial Control, Prev/Next & Completion Panel */}
      <ScrollView contentContainerStyle={styles.infoScroll}>
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          <Card style={styles.headerCard}>
            <View style={styles.metaRow}>
              <Badge
                variant="info"
                label={lesson.contentType === 'video' ? 'Video bài giảng' : 'Tài liệu bài đọc'}
                icon={
                  <Ionicons
                    name={
                      lesson.contentType === 'video'
                        ? 'videocam-outline'
                        : 'document-text-outline'
                    }
                    size={13}
                    color={semantic.brandPrimary}
                  />
                }
              />

              {Boolean(lesson.durationSeconds) && (
                <Text variant="caption" tabular style={styles.durationText}>
                  {Math.ceil((lesson.durationSeconds || 0) / 60)} phút
                </Text>
              )}
            </View>

            <Text variant="h2" style={styles.lessonTitle}>
              {lesson.title}
            </Text>
          </Card>

          {/* Prev / Next Navigation */}
          {(lesson.prevLessonId || lesson.nextLessonId) && (
            <View style={styles.navRow}>
              <Button
                title="← Bài trước"
                variant="outline"
                disabled={!lesson.prevLessonId}
                onPress={() => {
                  if (lesson.prevLessonId) {
                    router.replace(`/learn/lesson/${lesson.prevLessonId}` as const);
                  }
                }}
                style={styles.navButton}
              />
              <Button
                title="Bài tiếp theo →"
                variant="outline"
                disabled={!lesson.nextLessonId}
                onPress={() => {
                  if (lesson.nextLessonId) {
                    router.replace(`/learn/lesson/${lesson.nextLessonId}` as const);
                  }
                }}
                style={styles.navButton}
              />
            </View>
          )}

          {/* Completion Action Card */}
          <Card style={[styles.completionBox, isCompleted && styles.completionBoxActive]}>
            <View style={styles.completionHeader}>
              <View
                style={[
                  styles.statusIconWrap,
                  isCompleted ? styles.statusIconDone : styles.statusIconPending,
                ]}
              >
                <Ionicons
                  name={isCompleted ? 'checkmark-circle-outline' : 'hourglass-outline'}
                  size={20}
                  color={isCompleted ? semantic.success : semantic.warning}
                />
              </View>
              <View style={styles.completionHeaderText}>
                <Text style={styles.completionStatusTitle}>
                  {isCompleted ? 'Đã hoàn thành bài học này' : 'Chưa đánh dấu hoàn thành'}
                </Text>
                <Text style={styles.completionStatusDesc}>
                  {isCompleted
                    ? 'Tiến độ bài giảng đã được đồng bộ lên máy chủ và tính vào điều kiện cấp chứng chỉ.'
                    : 'Đánh dấu hoàn thành sau khi bạn đã nắm vững nội dung bài giảng.'}
                </Text>
              </View>
            </View>

            <Button
              title={isCompleted ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
              variant={isCompleted ? 'outline' : 'primary'}
              onPress={handleToggleCompletion}
              loading={isUpdatingCompletion}
              disabled={isUpdatingCompletion}
              style={styles.toggleButton}
            />
          </Card>
        </ResponsiveContainer>
      </ScrollView>

      {/* Certificate Congratulation Modal */}
      <Modal
        visible={issuedCertCode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setIssuedCertCode(null)}
      >
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <View style={styles.certIconWrap}>
              <Ionicons name="ribbon-outline" size={34} color={semantic.brandPrimary} />
            </View>
            <Text variant="h2" style={styles.modalTitle}>
              Hoàn thành khóa học!
            </Text>
            <Text style={styles.modalDesc}>
              Chúc mừng bạn đã hoàn tất 100% chương trình học và nhận được chứng chỉ tốt nghiệp từ Edumy.
            </Text>
            {Boolean(issuedCertCode) && (
              <View style={styles.certCodeBox}>
                <Text style={styles.certCodeLabel}>MÃ CHỨNG CHỈ</Text>
                <Text style={styles.certCodeValue}>{issuedCertCode}</Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <Button
                title="Xem chứng chỉ"
                onPress={() => {
                  setIssuedCertCode(null);
                  router.push('/account/certificates' as const);
                }}
                style={styles.modalActionBtn}
              />
              <Button
                title="Đóng"
                variant="outline"
                onPress={() => setIssuedCertCode(null)}
                style={styles.modalActionBtn}
              />
            </View>
          </Card>
        </View>
      </Modal>
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
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  durationText: {
    color: semantic.textMuted,
    fontWeight: '600',
  },
  lessonTitle: {
    fontSize: 19,
    lineHeight: 25,
    color: semantic.textPrimary,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  navButton: {
    flex: 1,
  },
  completionBox: {
    borderColor: semantic.borderSubtle,
  },
  completionBoxActive: {
    borderColor: semantic.successBorder,
    backgroundColor: semantic.successSoft,
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
    borderRadius: radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusIconDone: {
    backgroundColor: semantic.surfaceCard,
    borderColor: semantic.successBorder,
  },
  statusIconPending: {
    backgroundColor: semantic.warningSoft,
    borderColor: semantic.warningBorder,
  },
  completionHeaderText: {
    flex: 1,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  certIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: semantic.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  certCodeBox: {
    width: '100%',
    backgroundColor: semantic.surfaceCanvas,
    borderRadius: radius.btn,
    padding: 12,
    alignItems: 'center',
    marginBottom: 18,
  },
  certCodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  certCodeValue: {
    fontFamily: monoFontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: semantic.brandPrimary,
    fontVariant: ['tabular-nums'],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalActionBtn: {
    flex: 1,
  },
});
