// app/learn/qa/[questionId].tsx — Chi tiết chủ đề Hỏi & Đáp
import React, { useState } from 'react';
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
import {
  useQuestionDetail,
  useResolveQuestion,
  useAnswerQuestion,
  useDeleteQuestion,
} from '../../../src/features/qa/hooks';
import {
  validateAnswerInput,
  isQuestionReadOnly,
} from '../../../src/features/qa/logic';
import { useSessionStore } from '../../../src/store/session';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { ResponsiveContainer } from '../../../src/components/ui/ResponsiveContainer';
import { formatDateTime } from '../../../src/lib/date';
import { AppError } from '../../../src/api/problem';
import { layout, radius, semantic } from '../../../src/theme/tokens';

export default function QuestionDetailScreen() {
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const numericId = Number(questionId);
  const router = useRouter();
  const { me } = useSessionStore();

  const [newAnswer, setNewAnswer] = useState('');
  const [answerError, setAnswerError] = useState<string | null>(null);

  const { data: thread, isLoading, isError, error, refetch } = useQuestionDetail(numericId);
  const { mutate: resolveQuestion, isPending: isResolving } = useResolveQuestion(numericId);
  const { mutate: postAnswer, isPending: isPostingAnswer } = useAnswerQuestion(numericId);
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion(thread?.courseId);

  if (isLoading) {
    return <Loading message="Đang tải nội dung thảo luận..." />;
  }

  if (isError || !thread) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Hỏi & Đáp', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          error={error}
          message={error?.message || 'Không tìm thấy câu hỏi.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const isAsker = me?.id !== undefined && thread.askerId === me.id;
  const isInstructorRole = Boolean(
    me?.roles?.some((r) => typeof r === 'string' && r.toLowerCase() === 'instructor')
  );
  const canResolve = isAsker || isInstructorRole;
  const isReadOnly = isQuestionReadOnly(thread.visibilityStatus);

  const handleToggleResolve = () => {
    resolveQuestion(!thread.isResolved, {
      onError: (err) => {
        const appErr = err as unknown as AppError;
        void notify('Lỗi', appErr.message || 'Không thể cập nhật trạng thái.');
      },
    });
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Xóa câu hỏi',
      message: 'Bạn có chắc chắn muốn xóa câu hỏi này cùng các câu trả lời?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (!ok) return;

    deleteQuestion(numericId, {
      onSuccess: () => {
        router.back();
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        void notify('Lỗi', appErr.message || 'Không thể xóa câu hỏi.');
      },
    });
  };

  const handleSendAnswer = () => {
    const val = validateAnswerInput(newAnswer);
    if (!val.valid) {
      setAnswerError(val.message || 'Nội dung không hợp lệ');
      return;
    }

    postAnswer(newAnswer.trim(), {
      onSuccess: () => {
        setNewAnswer('');
        setAnswerError(null);
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        setAnswerError(appErr.message || 'Không thể gửi câu trả lời.');
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <Stack.Screen
        options={{
          title: 'Chi tiết câu hỏi',
          headerBackTitle: 'Hỏi & Đáp',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          {/* Hidden by admin banner */}
          {isReadOnly && (
            <View style={styles.hiddenBanner}>
              <Ionicons name="lock-closed-outline" size={18} color={semantic.danger} />
              <Text style={styles.hiddenBannerText}>
                Câu hỏi này đã bị quản trị viên ẩn và chuyển sang chế độ chỉ đọc.
              </Text>
            </View>
          )}

          {/* Question Header Card */}
          <Card style={styles.questionCard}>
            <View style={styles.metaRow}>
              <View style={styles.authorGroup}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(thread.askerName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{thread.askerName || 'Học viên'}</Text>
                  <Text style={styles.dateText}>{formatDateTime(thread.createdAt)}</Text>
                </View>
              </View>

              {thread.isResolved ? (
                <Badge
                  variant="success"
                  label="Đã giải quyết"
                  icon={<Ionicons name="checkmark-circle-outline" size={13} color={semantic.success} />}
                />
              ) : (
                <Badge
                  variant="warning"
                  label="Đang chờ"
                  icon={<Ionicons name="help-circle-outline" size={13} color={semantic.warning} />}
                />
              )}
            </View>

            <Text variant="h2" style={styles.questionTitle}>
              {thread.title}
            </Text>

            <Text style={styles.questionContent}>{thread.content}</Text>

            {/* Asker / Instructor Controls */}
            {canResolve && !isReadOnly && (
              <View style={styles.askerActions}>
                <Button
                  title={thread.isResolved ? 'Mở lại câu hỏi' : 'Đánh dấu đã giải quyết'}
                  variant={thread.isResolved ? 'outline' : 'primary'}
                  onPress={handleToggleResolve}
                  loading={isResolving}
                  disabled={isResolving}
                  style={styles.resolveBtn}
                />
                {isAsker && (
                  <Button
                    title="Xóa"
                    variant="outline"
                    onPress={handleDelete}
                    loading={isDeleting}
                    disabled={isDeleting}
                    style={styles.deleteBtn}
                    textStyle={{ color: semantic.danger }}
                  />
                )}
              </View>
            )}
          </Card>

          {/* Answers List */}
          <View style={styles.answersSection}>
            <Text variant="h3" style={styles.sectionHeader}>
              Câu trả lời ({thread.answers?.length || 0})
            </Text>

            {thread.answers && thread.answers.length > 0 ? (
              thread.answers.map((ans) => {
                const isInstructor = ans.authorType?.toLowerCase() === 'instructor';

                return (
                  <Card
                    key={ans.id}
                    variant={isInstructor ? 'soft' : 'default'}
                    style={styles.answerCard}
                  >
                    <View style={styles.answerHeader}>
                      <View style={styles.authorGroup}>
                        <View
                          style={[
                            styles.avatarMini,
                            isInstructor && styles.avatarMiniInstructor,
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarMiniText,
                              isInstructor && styles.avatarMiniTextInstructor,
                            ]}
                          >
                            {(ans.authorName || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <View style={styles.nameWithBadge}>
                            <Text style={styles.authorName}>{ans.authorName || 'Người dùng'}</Text>
                            {isInstructor && <Badge variant="info" label="Giảng viên" />}
                          </View>
                          <Text style={styles.dateText}>{formatDateTime(ans.createdAt)}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.answerContent}>{ans.content}</Text>
                  </Card>
                );
              })
            ) : (
              <Card style={styles.emptyAnswers}>
                <Text style={styles.emptyAnswersText}>
                  Chưa có ai trả lời câu hỏi này. Hãy là người đầu tiên giúp đỡ bạn học!
                </Text>
              </Card>
            )}
          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* Reply Input Bar (If not read-only) */}
      {!isReadOnly && (
        <View style={styles.replyBar}>
          <ResponsiveContainer maxWidth={layout.maxContentWidth}>
            {answerError && (
              <View style={styles.inlineError}>
                <Text style={styles.inlineErrorText}>{answerError}</Text>
              </View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.replyInput}
                placeholder="Nhập câu trả lời của bạn..."
                placeholderTextColor={semantic.textPlaceholder}
                value={newAnswer}
                onChangeText={(t) => {
                  setNewAnswer(t);
                  setAnswerError(null);
                }}
                multiline
                maxLength={5000}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (isPostingAnswer || !newAnswer.trim()) && styles.sendBtnDisabled,
                ]}
                onPress={handleSendAnswer}
                disabled={isPostingAnswer || !newAnswer.trim()}
                accessibilityRole="button"
                accessibilityLabel="Gửi câu trả lời"
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ResponsiveContainer>
        </View>
      )}
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
  hiddenBanner: {
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
  hiddenBannerText: {
    fontSize: 13,
    color: semantic.danger,
    flex: 1,
  },
  questionCard: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: semantic.brandPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  avatarMini: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniInstructor: {
    backgroundColor: semantic.brandPrimary,
    borderColor: semantic.brandPrimary,
  },
  avatarMiniText: {
    color: semantic.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  avatarMiniTextInstructor: {
    color: '#FFFFFF',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  questionTitle: {
    color: semantic.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  questionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: semantic.textBody,
  },
  askerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: semantic.surfaceMuted,
  },
  resolveBtn: {
    flex: 1,
  },
  deleteBtn: {
    borderColor: semantic.dangerBorder,
  },
  answersSection: {
    gap: 10,
  },
  sectionHeader: {
    color: semantic.textPrimary,
    marginBottom: 4,
  },
  answerCard: {
    padding: 14,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerContent: {
    fontSize: 14,
    lineHeight: 21,
    color: semantic.textBody,
  },
  emptyAnswers: {
    padding: 24,
    alignItems: 'center',
  },
  emptyAnswersText: {
    fontSize: 13,
    color: semantic.textMuted,
    textAlign: 'center',
  },
  replyBar: {
    backgroundColor: semantic.surfacePage,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: semantic.borderSubtle,
  },
  inlineError: {
    marginBottom: 6,
  },
  inlineErrorText: {
    fontSize: 12,
    color: semantic.danger,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  replyInput: {
    flex: 1,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 14,
    maxHeight: 100,
    color: semantic.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.btn,
    backgroundColor: semantic.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: semantic.textPlaceholder,
  },
});
