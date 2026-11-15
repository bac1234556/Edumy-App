import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Divider, Text, TextInput } from 'react-native-paper';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../api/client';
import {
  acceptQuestionAnswer,
  createLessonQuestion,
  createQuestionAnswer,
  fetchLessonQuestions,
} from '../api/qa';
import EmptyView from './common/EmptyView';
import ErrorView from './common/ErrorView';
import LoadingView from './common/LoadingView';

const MAX_CONTENT_LENGTH = 5000;

export default function LessonQASection({ lessonId, instructorId, currentUserId, role }) {
  const queryClient = useQueryClient();
  const [questionFormVisible, setQuestionFormVisible] = useState(false);
  const [questionContent, setQuestionContent] = useState('');
  const [questionFormError, setQuestionFormError] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [answerFormError, setAnswerFormError] = useState(null);

  const questionsQuery = useInfiniteQuery({
    queryKey: ['lesson-questions', lessonId],
    queryFn: ({ pageParam }) => fetchLessonQuestions(lessonId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
    enabled: Boolean(lessonId),
  });
  const questions = questionsQuery.data?.pages.flatMap((page) => page.content || []) || [];
  const selectedQuestion = questions.find((question) => question.id === selectedQuestionId);
  const isCourseInstructor = role === 'INSTRUCTOR'
    && Number(currentUserId) === Number(instructorId);

  const invalidateQuestions = () => queryClient.invalidateQueries({
    queryKey: ['lesson-questions', lessonId],
  });

  const questionMutation = useMutation({
    mutationFn: (content) => createLessonQuestion(lessonId, content),
    onSuccess: async () => {
      setQuestionContent('');
      setQuestionFormError(null);
      setQuestionFormVisible(false);
      await invalidateQuestions();
    },
  });
  const answerMutation = useMutation({
    mutationFn: ({ questionId, content }) => createQuestionAnswer(questionId, content),
    onSuccess: async () => {
      setAnswerContent('');
      setAnswerFormError(null);
      await invalidateQuestions();
    },
  });
  const acceptMutation = useMutation({
    mutationFn: acceptQuestionAnswer,
    onSuccess: invalidateQuestions,
  });

  const submitQuestion = () => {
    const content = questionContent.trim();
    if (!content) {
      setQuestionFormError('Nội dung câu hỏi không được để trống.');
      return;
    }
    questionMutation.mutate(content);
  };

  const submitAnswer = () => {
    const content = answerContent.trim();
    if (!content) {
      setAnswerFormError('Nội dung câu trả lời không được để trống.');
      return;
    }
    answerMutation.mutate({ questionId: selectedQuestionId, content });
  };

  const openQuestion = (questionId) => {
    setSelectedQuestionId(questionId);
    setAnswerContent('');
    setAnswerFormError(null);
  };

  if (questionsQuery.isPending) return <LoadingView message="Đang tải câu hỏi..." />;
  if (questionsQuery.isError && !questionsQuery.data) {
    return <ErrorView message={errorMessage(questionsQuery.error)} onRetry={questionsQuery.refetch} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Button
          mode="contained"
          icon="comment-plus-outline"
          testID="qa-open-question-form"
          onPress={() => {
            setQuestionContent('');
            setQuestionFormError(null);
            setQuestionFormVisible(true);
          }}
        >
          Đặt câu hỏi
        </Button>

        {questions.length === 0 ? (
          <EmptyView message="Chưa có câu hỏi nào cho bài học này." />
        ) : questions.map((question) => (
          <TouchableOpacity
            key={question.id}
            testID={`qa-question-${question.id}`}
            accessibilityRole="button"
            onPress={() => openQuestion(question.id)}
            style={{
              padding: 14,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
              gap: 6,
            }}
          >
            <Text variant="titleSmall">{question.title || question.content}</Text>
            <Text numberOfLines={2} style={{ color: '#475569' }}>{question.content}</Text>
            <Text variant="bodySmall" style={{ color: '#64748B' }}>
              {question.answerCount} câu trả lời
              {question.hasAcceptedAnswer ? ' · Đã có câu trả lời được chấp nhận' : ''}
            </Text>
          </TouchableOpacity>
        ))}

        {questionsQuery.isFetchNextPageError && (
          <ErrorView message={errorMessage(questionsQuery.error)} onRetry={questionsQuery.fetchNextPage} />
        )}
        {questionsQuery.hasNextPage && (
          <Button
            mode="outlined"
            testID="qa-load-more"
            loading={questionsQuery.isFetchingNextPage}
            disabled={questionsQuery.isFetchingNextPage}
            onPress={() => questionsQuery.fetchNextPage()}
          >
            Tải thêm câu hỏi
          </Button>
        )}
      </ScrollView>

      <Modal
        visible={questionFormVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuestionFormVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
        >
          <View style={{ padding: 20, borderRadius: 12, backgroundColor: '#FFFFFF', gap: 12 }}>
            <Text variant="titleLarge">Đặt câu hỏi</Text>
            <TextInput
              mode="outlined"
              label="Nội dung câu hỏi"
              multiline
              maxLength={MAX_CONTENT_LENGTH}
              value={questionContent}
              onChangeText={(value) => {
                setQuestionContent(value);
                setQuestionFormError(null);
              }}
              testID="qa-question-content"
            />
            {!!questionFormError && <Text accessibilityRole="alert" style={{ color: '#B91C1C' }}>{questionFormError}</Text>}
            {!!questionMutation.error && (
              <Text accessibilityRole="alert" style={{ color: '#B91C1C' }}>
                {errorMessage(questionMutation.error)}
              </Text>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button onPress={() => setQuestionFormVisible(false)}>Hủy</Button>
              <Button
                mode="contained"
                testID="qa-submit-question"
                loading={questionMutation.isPending}
                disabled={questionMutation.isPending}
                onPress={submitQuestion}
              >
                Gửi câu hỏi
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={Boolean(selectedQuestion)}
        animationType="slide"
        onRequestClose={() => setSelectedQuestionId(null)}
      >
        {selectedQuestion && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: '#FFFFFF' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
              <Text variant="titleLarge" style={{ flex: 1 }}>Câu hỏi</Text>
              <Button onPress={() => setSelectedQuestionId(null)}>Đóng</Button>
            </View>
            <Divider />
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
              <Text variant="titleMedium">{selectedQuestion.title || 'Câu hỏi'}</Text>
              <Text>{selectedQuestion.content}</Text>
              <Divider />
              <Text variant="titleMedium">Câu trả lời ({selectedQuestion.answerCount})</Text>
              {selectedQuestion.answers?.length ? selectedQuestion.answers.map((answer) => {
                const canAccept = isCourseInstructor
                  || Number(selectedQuestion.authorId) === Number(currentUserId);
                const isInstructorAnswer = Number(answer.authorId) === Number(instructorId);
                return (
                  <View
                    key={answer.id}
                    testID={`qa-answer-${answer.id}`}
                    style={{ padding: 12, borderRadius: 8, backgroundColor: '#F8FAFC', gap: 8 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {isInstructorAnswer && (
                        <Text
                          testID={`qa-instructor-badge-${answer.id}`}
                          style={{ color: '#1D4ED8', fontWeight: '700' }}
                        >
                          Instructor
                        </Text>
                      )}
                      {answer.accepted && (
                        <Text
                          testID={`qa-accepted-${answer.id}`}
                          style={{ color: '#047857', fontWeight: '700' }}
                        >
                          ✓ Được chấp nhận
                        </Text>
                      )}
                    </View>
                    <Text>{answer.content}</Text>
                    {canAccept && !answer.accepted && (
                      <Button
                        mode="outlined"
                        testID={`qa-accept-${answer.id}`}
                        loading={acceptMutation.isPending}
                        disabled={acceptMutation.isPending}
                        onPress={() => acceptMutation.mutate(answer.id)}
                      >
                        Chấp nhận câu trả lời
                      </Button>
                    )}
                  </View>
                );
              }) : <EmptyView message="Chưa có câu trả lời nào." />}

              {!!answerMutation.error && (
                <Text accessibilityRole="alert" style={{ color: '#B91C1C' }}>
                  {errorMessage(answerMutation.error)}
                </Text>
              )}
              {!!acceptMutation.error && (
                <Text accessibilityRole="alert" style={{ color: '#B91C1C' }}>
                  {errorMessage(acceptMutation.error)}
                </Text>
              )}
              <TextInput
                mode="outlined"
                label="Câu trả lời của bạn"
                multiline
                maxLength={MAX_CONTENT_LENGTH}
                value={answerContent}
                onChangeText={(value) => {
                  setAnswerContent(value);
                  setAnswerFormError(null);
                }}
                testID="qa-answer-content"
              />
              {!!answerFormError && <Text accessibilityRole="alert" style={{ color: '#B91C1C' }}>{answerFormError}</Text>}
              <Button
                mode="contained"
                testID="qa-submit-answer"
                loading={answerMutation.isPending}
                disabled={answerMutation.isPending}
                onPress={submitAnswer}
              >
                Gửi trả lời
              </Button>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </View>
  );
}
