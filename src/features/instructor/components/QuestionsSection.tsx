// src/features/instructor/components/QuestionsSection.tsx
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInstructorQuestions } from '../hooks';
import { Text } from '../../../components/ui/Text';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Loading } from '../../../components/ui/Loading';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatDate } from '../../../lib/date';
import { microShadow, radius, semantic } from '../../../theme/tokens';

export function QuestionsSection() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'unanswered' | 'all'>('unanswered');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInstructorQuestions(statusFilter);

  const questions = data?.pages.flatMap((p) => p.content ?? []) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.pill, statusFilter === 'unanswered' && styles.pillActive]}
          onPress={() => setStatusFilter('unanswered')}
        >
          <Text
            style={[
              styles.pillText,
              statusFilter === 'unanswered' && styles.pillTextActive,
            ]}
          >
            Chưa trả lời
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, statusFilter === 'all' && styles.pillActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text
            style={[styles.pillText, statusFilter === 'all' && styles.pillTextActive]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Loading message="Đang tải câu hỏi học viên..." />
      ) : isError ? (
        <ErrorState
          error={error}
          message={error?.message || 'Không thể tải danh sách câu hỏi.'}
          onRetry={() => refetch()}
        />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="chatbubbles-outline" size={26} color={semantic.brandPrimary} />}
          title={
            statusFilter === 'unanswered'
              ? 'Không có câu hỏi chờ trả lời'
              : 'Chưa có câu hỏi nào'
          }
          description="Khi học viên đặt câu hỏi trong khóa học của bạn, câu hỏi sẽ xuất hiện tại đây."
        />
      ) : (
        <View style={styles.list}>
          {questions.map((q) => {
            const qId = q.id ?? q.questionId;
            return (
              <TouchableOpacity
                key={String(qId)}
                style={[styles.card, microShadow]}
                onPress={() => qId && router.push(`/learn/qa/${qId}` as const)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Trả lời câu hỏi ${q.title ?? ''}`}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.courseLabel} numberOfLines={1}>
                    {q.courseTitle}
                  </Text>
                  {q.isResolved ? (
                    <Badge variant="success" label="Đã giải quyết" />
                  ) : (
                    <Badge variant="warning" label="Đang chờ" />
                  )}
                </View>

                <Text style={styles.title} numberOfLines={2}>
                  {q.title}
                </Text>

                {Boolean(q.contentSnippet || q.content) && (
                  <Text style={styles.snippet} numberOfLines={2}>
                    {q.contentSnippet || q.content}
                  </Text>
                )}

                <View style={styles.footer}>
                  <Text style={styles.metaText}>
                    {q.askerName || 'Học viên'} · {formatDate(q.createdAt ?? '')}
                  </Text>
                  <Text style={styles.metaText}>{q.answerCount ?? 0} trả lời</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {hasNextPage && (
            <Button
              title={isFetchingNextPage ? 'Đang tải...' : 'Tải thêm câu hỏi'}
              variant="outline"
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: semantic.surfaceCard,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  pillActive: {
    backgroundColor: semantic.brandPrimary,
    borderColor: semantic.brandPrimary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: semantic.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  courseLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: semantic.brandPrimary,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: semantic.textPrimary,
    marginBottom: 4,
  },
  snippet: {
    fontSize: 13,
    color: semantic.textBody,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: semantic.surfaceMuted,
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
