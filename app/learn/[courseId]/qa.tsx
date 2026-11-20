// app/learn/[courseId]/qa.tsx — Diễn đàn Hỏi & Đáp khóa học
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourseQuestions, useCreateQuestion } from '../../../src/features/qa/hooks';
import { validateQuestionInput } from '../../../src/features/qa/logic';
import { QuestionSummary } from '../../../src/features/qa/api';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ResponsiveContainer } from '../../../src/components/ui/ResponsiveContainer';
import { formatDate } from '../../../src/lib/date';
import { AppError } from '../../../src/api/problem';
import { layout, microShadow, radius, semantic } from '../../../src/theme/tokens';

export default function CourseQaScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const numericCourseId = Number(courseId);
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'all' | 'resolved' | 'unresolved'>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isRefetching } = useCourseQuestions(
    numericCourseId,
    page
  );
  const { mutate: createQuestion, isPending: isCreating } = useCreateQuestion(numericCourseId);

  const allQuestions = data?.content || [];
  const questions = allQuestions.filter((q) => {
    if (filter === 'resolved') return Boolean(q.isResolved);
    if (filter === 'unresolved') return !q.isResolved;
    return true;
  });

  if (isLoading) {
    return <Loading message="Đang tải danh sách câu hỏi..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Hỏi & Đáp', headerBackTitle: 'Quay lại' }} />
        <ErrorState
          error={error}
          message={error?.message || 'Không thể tải danh sách hỏi đáp.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const handleOpenModal = () => {
    setNewTitle('');
    setNewContent('');
    setValidationError(null);
    setIsModalVisible(true);
  };

  const handlePostQuestion = () => {
    const val = validateQuestionInput(newTitle, newContent);
    if (!val.valid) {
      setValidationError(val.message || 'Dữ liệu không hợp lệ');
      return;
    }

    createQuestion(
      {
        title: newTitle.trim(),
        content: newContent.trim(),
      },
      {
        onSuccess: (created) => {
          setIsModalVisible(false);
          refetch();
          const createdId = created.id ?? created.questionId;
          if (createdId) {
            router.push(`/learn/qa/${createdId}` as const);
          }
        },
        onError: (err) => {
          const appErr = err as unknown as AppError;
          if (appErr.code === 'QA_QUESTION_DUPLICATE' || appErr.status === 409) {
            setValidationError('Bạn đã gửi một câu hỏi tương tự gần đây. Vui lòng kiểm tra lại.');
          } else {
            setValidationError(appErr.message || 'Không thể gửi câu hỏi.');
          }
        },
      }
    );
  };

  const renderQuestionItem = ({ item }: { item: QuestionSummary }) => (
    <TouchableOpacity
      style={[styles.card, microShadow]}
      onPress={() => router.push(`/learn/qa/${item.id}` as const)}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Xem câu hỏi ${item.title}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.askerRow}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarText}>
              {(item.askerName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.askerName}>{item.askerName || 'Học viên'}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt ?? '')}</Text>
        </View>

        {item.isResolved ? (
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

      <Text variant="h3" numberOfLines={2} style={styles.questionTitle}>
        {item.title}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.answersCount}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={semantic.textMuted} />
          <Text style={styles.footerText}>{item.answerCount ?? 0} câu trả lời</Text>
        </View>

        {item.hasInstructorAnswer && (
          <Badge
            variant="info"
            label="Giảng viên đã trả lời"
            icon={<Ionicons name="shield-checkmark-outline" size={12} color={semantic.brandPrimary} />}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Hỏi & Đáp', headerBackTitle: 'Quay lại' }} />

      {/* Filter Tabs & Ask Button */}
      <View style={styles.topControlBar}>
        <ResponsiveContainer maxWidth={layout.maxContentWidth}>
          <View style={styles.topControlInner}>
            <View style={styles.filterTabs}>
              <TouchableOpacity
                style={[styles.tabBtn, filter === 'all' && styles.tabBtnActive]}
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
                  Tất cả
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, filter === 'unresolved' && styles.tabBtnActive]}
                onPress={() => setFilter('unresolved')}
              >
                <Text style={[styles.tabText, filter === 'unresolved' && styles.tabTextActive]}>
                  Đang chờ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, filter === 'resolved' && styles.tabBtnActive]}
                onPress={() => setFilter('resolved')}
              >
                <Text style={[styles.tabText, filter === 'resolved' && styles.tabTextActive]}>
                  Đã xong
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.askBtn}
              onPress={handleOpenModal}
              accessibilityRole="button"
              accessibilityLabel="Đặt câu hỏi mới"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.askBtnText}>Đặt câu hỏi</Text>
            </TouchableOpacity>
          </View>
        </ResponsiveContainer>
      </View>

      {/* Questions List */}
      {questions.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="chatbubbles-outline" size={26} color={semantic.brandPrimary} />}
          title="Chưa có câu hỏi nào"
          description="Hãy đặt câu hỏi đầu tiên để được giảng viên và các bạn học viên trợ giúp."
          actionTitle="Đặt câu hỏi ngay"
          onAction={handleOpenModal}
        />
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderQuestionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={() => {
            if (data?.page && page + 1 < (data.page.totalPages ?? 0)) {
              setPage((prev) => prev + 1);
            }
          }}
          onEndReachedThreshold={0.4}
        />
      )}

      {/* New Question Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text variant="h3">Đặt câu hỏi mới</Text>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={styles.modalCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Đóng hộp thoại đặt câu hỏi"
                >
                  <Ionicons name="close" size={22} color={semantic.textMuted} />
                </TouchableOpacity>
              </View>

              {validationError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={semantic.danger} />
                  <Text style={styles.errorBannerText}>{validationError}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Tiêu đề ngắn gọn (tối đa 200 ký tự)</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="VD: Không hiểu cách tính phần trăm ở phút 03:15..."
                placeholderTextColor={semantic.textPlaceholder}
                value={newTitle}
                onChangeText={(t) => {
                  setNewTitle(t);
                  setValidationError(null);
                }}
                maxLength={200}
              />

              <Text style={styles.inputLabel}>Chi tiết câu hỏi (tối đa 5000 ký tự)</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Mô tả cụ thể vấn đề bạn gặp phải để nhận trợ giúp nhanh nhất..."
                placeholderTextColor={semantic.textPlaceholder}
                value={newContent}
                onChangeText={(t) => {
                  setNewContent(t);
                  setValidationError(null);
                }}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={5000}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Hủy"
                  variant="outline"
                  onPress={() => setIsModalVisible(false)}
                  disabled={isCreating}
                  style={styles.modalActionBtn}
                />
                <Button
                  title="Gửi câu hỏi"
                  onPress={handlePostQuestion}
                  loading={isCreating}
                  disabled={isCreating}
                  style={styles.modalActionBtn}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  topControlBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: semantic.surfacePage,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderSubtle,
  },
  topControlInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: semantic.surfaceMuted,
    borderRadius: radius.btn,
    padding: 3,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: semantic.surfaceCard,
  },
  tabText: {
    fontSize: 12,
    color: semantic.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: semantic.brandPrimary,
    fontWeight: '700',
  },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.brandPrimary,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: radius.btn,
    gap: 4,
  },
  askBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  askerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: semantic.brandPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  askerName: {
    fontSize: 13,
    fontWeight: '600',
    color: semantic.textBody,
  },
  dot: {
    color: semantic.textPlaceholder,
  },
  dateText: {
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  questionTitle: {
    color: semantic.textPrimary,
    marginBottom: 12,
    lineHeight: 21,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: semantic.surfaceMuted,
  },
  answersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: layout.maxReadingWidth,
    backgroundColor: semantic.surfaceCard,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCloseBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.dangerSoft,
    borderWidth: 1,
    borderColor: semantic.dangerBorder,
    padding: 10,
    borderRadius: radius.btn,
    marginBottom: 12,
    gap: 6,
  },
  errorBannerText: {
    fontSize: 13,
    color: semantic.danger,
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: semantic.textPrimary,
    marginBottom: 6,
  },
  titleInput: {
    backgroundColor: semantic.surfaceCanvas,
    borderWidth: 1,
    borderColor: semantic.borderStrong,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 14,
    color: semantic.textPrimary,
    marginBottom: 14,
  },
  contentInput: {
    backgroundColor: semantic.surfaceCanvas,
    borderWidth: 1,
    borderColor: semantic.borderStrong,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: semantic.textPrimary,
    minHeight: 120,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
  },
});
