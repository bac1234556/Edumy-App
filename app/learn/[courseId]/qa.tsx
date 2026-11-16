// app/learn/[courseId]/qa.tsx — Diễn đàn Hỏi & Đáp khóa học
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCourseQuestions, useCreateQuestion } from '../../../src/features/qa/hooks';
import { validateQuestionInput } from '../../../src/features/qa/logic';
import { QuestionSummary } from '../../../src/features/qa/api';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { formatDate } from '../../../src/lib/date';
import { AppError } from '../../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';

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
    if (filter === 'resolved') return q.resolved;
    if (filter === 'unresolved') return !q.resolved;
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
          router.push(`/learn/qa/${created.id}` as const);
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
      style={styles.card}
      onPress={() => router.push(`/learn/qa/${item.id}` as const)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.askerRow}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarText}>
              {(item.asker?.fullName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.askerName}>{item.asker?.fullName || 'Học viên'}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.resolved ? (
          <View style={styles.resolvedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.resolvedText}>Đã giải quyết</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Ionicons name="help-circle-outline" size={14} color="#D97706" />
            <Text style={styles.pendingText}>Đang chờ</Text>
          </View>
        )}
      </View>

      <Text variant="h3" numberOfLines={2} style={styles.questionTitle}>
        {item.title}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.answersCount}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#64748B" />
          <Text style={styles.footerText}>{item.answerCount} câu trả lời</Text>
        </View>

        {item.instructorReplied && (
          <View style={styles.instructorBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#0D9488" />
            <Text style={styles.instructorBadgeText}>Giảng viên đã trả lời</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Hỏi & Đáp', headerBackTitle: 'Quay lại' }} />

      {/* Filter Tabs & Ask Button */}
      <View style={styles.topControlBar}>
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
              Chưa giải quyết
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

        <TouchableOpacity style={styles.askBtn} onPress={handleOpenModal}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.askBtnText}>Đặt câu hỏi</Text>
        </TouchableOpacity>
      </View>

      {/* Questions List */}
      {questions.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="chatbubbles-outline" size={56} color="#94A3B8" />}
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
            if (data?.page && page + 1 < data.page.totalPages) {
              setPage((prev) => prev + 1);
            }
          }}
          onEndReachedThreshold={0.4}
        />
      )}

      {/* New Question Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h3">Đặt câu hỏi mới</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {validationError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorBannerText}>{validationError}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Tiêu đề ngắn gọn (tối đa 200 ký tự)</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="VD: Không hiểu cách tính phần trăm ở phút 03:15..."
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
                style={styles.modalCancelBtn}
              />
              <Button
                title="Gửi câu hỏi"
                onPress={handlePostQuestion}
                loading={isCreating}
                style={styles.modalSubmitBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  topControlBar: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  askBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  askerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  askerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  dot: {
    color: '#94A3B8',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  resolvedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  questionTitle: {
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  answersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
  instructorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  instructorBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  titleInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  contentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 120,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
  },
  modalSubmitBtn: {
    flex: 1,
  },
});
