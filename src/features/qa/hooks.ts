// src/features/qa/hooks.ts
// React Query hooks for Q&A questions and answers.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCourseQuestionsApi,
  getQuestionDetailApi,
  createQuestionApi,
  resolveQuestionApi,
  answerQuestionApi,
  deleteQuestionApi,
  CreateQuestionInput,
} from './api';
import { queryKeys } from '../../api/query-keys';
import { useSessionStore } from '../../store/session';

export function useCourseQuestions(courseId: number, page: number = 0) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.qa.courseQuestions(courseId, page),
    queryFn: () => getCourseQuestionsApi(courseId, page),
    enabled: isLoggedIn && Boolean(courseId),
  });
}

export function useQuestionDetail(id: number) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.qa.questionDetail(id),
    queryFn: () => getQuestionDetailApi(id),
    enabled: isLoggedIn && Boolean(id),
  });
}

export function useCreateQuestion(courseId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateQuestionInput) => createQuestionApi(courseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['qa', 'course', courseId],
      });
    },
  });
}

export function useResolveQuestion(questionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resolved: boolean) => resolveQuestionApi(questionId, resolved),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.qa.questionDetail(questionId),
      });
      queryClient.invalidateQueries({
        queryKey: ['qa', 'course'],
      });
    },
  });
}

export function useAnswerQuestion(questionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => answerQuestionApi(questionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.qa.questionDetail(questionId),
      });
    },
  });
}

export function useDeleteQuestion(courseId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteQuestionApi(id),
    onSuccess: () => {
      if (courseId) {
        queryClient.invalidateQueries({
          queryKey: ['qa', 'course', courseId],
        });
      }
    },
  });
}
