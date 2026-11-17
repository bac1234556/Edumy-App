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
import { confirm, notify } from '../../../src/lib/dialog';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
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
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { formatDateTime } from '../../../src/lib/date';
import { AppError } from '../../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';

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
          message={error?.message || 'Không tìm thấy câu hỏi.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const isAsker = me?.id !== undefined && thread.asker?.id === me.id;
  const isReadOnly = isQuestionReadOnly(thread.status);

  const handleToggleResolve = () => {
    resolveQuestion(!thread.resolved, {
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hidden by admin banner */}
        {isReadOnly && (
          <View style={styles.hiddenBanner}>
            <Ionicons name="lock-closed" size={18} color="#DC2626" />
            <Text style={styles.hiddenBannerText}>
              Câu hỏi này đã bị quản trị viên ẩn và chuyển sang chế độ chỉ đọc.
            </Text>
          </View>
        )}

        {/* Question Header Card */}
        <View style={styles.questionCard}>
          <View style={styles.metaRow}>
            <View style={styles.authorGroup}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(thread.asker?.fullName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>{thread.asker?.fullName || 'Học viên'}</Text>
                <Text style={styles.dateText}>{formatDateTime(thread.createdAt)}</Text>
              </View>
            </View>

            {thread.resolved ? (
              <View style={styles.resolvedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.resolvedBadgeText}>Đã giải quyết</Text>
              </View>
            ) : (
              <View style={styles.unresolvedBadge}>
                <Ionicons name="help-circle-outline" size={14} color="#D97706" />
                <Text style={styles.unresolvedBadgeText}>Đang chờ</Text>
              </View>
            )}
          </View>

          <Text variant="h2" style={styles.questionTitle}>
            {thread.title}
          </Text>

          <Text style={styles.questionContent}>{thread.content}</Text>

          {/* Asker Controls */}
          {isAsker && !isReadOnly && (
            <View style={styles.askerActions}>
              <Button
                title={thread.resolved ? 'Mở lại câu hỏi' : 'Đánh dấu đã giải quyết'}
                variant={thread.resolved ? 'outline' : 'primary'}
                onPress={handleToggleResolve}
                loading={isResolving}
                style={styles.resolveBtn}
              />
              <Button
                title="Xóa"
                variant="outline"
                onPress={handleDelete}
                loading={isDeleting}
                style={styles.deleteBtn}
                textStyle={{ color: '#EF4444' }}
              />
            </View>
          )}
        </View>

        {/* Answers List */}
        <View style={styles.answersSection}>
          <Text variant="h3" style={styles.sectionHeader}>
            Câu trả lời ({thread.answers?.length || 0})
          </Text>

          {thread.answers && thread.answers.length > 0 ? (
            thread.answers.map((ans) => {
              const isInstructor = ans.authorType === 'instructor';

              return (
                <View
                  key={ans.id}
                  style={[
                    styles.answerCard,
                    isInstructor && styles.instructorAnswerCard,
                  ]}
                >
                  <View style={styles.answerHeader}>
                    <View style={styles.authorGroup}>
                      <View
                        style={[
                          styles.avatarMini,
                          isInstructor && { backgroundColor: '#0D9488' },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {(ans.author?.fullName || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <View style={styles.nameWithBadge}>
                          <Text style={styles.authorName}>{ans.author?.fullName}</Text>
                          {isInstructor && (
                            <View style={styles.instructorTag}>
                              <Text style={styles.instructorTagText}>Giảng viên</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.dateText}>{formatDateTime(ans.createdAt)}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.answerContent}>{ans.content}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyAnswers}>
              <Text style={styles.emptyAnswersText}>
                Chưa có ai trả lời câu hỏi này. Hãy là người đầu tiên giúp đỡ bạn học!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Reply Input Bar (If not read-only) */}
      {!isReadOnly && (
        <View style={styles.replyBar}>
          {answerError && (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>{answerError}</Text>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.replyInput}
              placeholder="Nhập câu trả lời của bạn..."
              placeholderTextColor="#94A3B8"
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
                !newAnswer.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleSendAnswer}
              disabled={isPostingAnswer || !newAnswer.trim()}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  hiddenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  hiddenBannerText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructorTag: {
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  instructorTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  resolvedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  unresolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  unresolvedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  questionTitle: {
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 24,
  },
  questionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  askerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resolveBtn: {
    flex: 1,
  },
  deleteBtn: {
    borderColor: '#FCA5A5',
  },
  answersSection: {
    gap: 10,
  },
  sectionHeader: {
    color: '#0F172A',
    marginBottom: 4,
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructorAnswerCard: {
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
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
    color: '#334155',
  },
  emptyAnswers: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyAnswersText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  replyBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inlineError: {
    marginBottom: 6,
  },
  inlineErrorText: {
    fontSize: 12,
    color: '#DC2626',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    color: '#0F172A',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});
