// src/features/learning/hooks.ts
// React Query hooks for enrollments, course outline, lesson details, visit & completion.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyEnrollmentsApi,
  getCourseLearnRoomApi,
  getLessonDetailApi,
  recordLessonVisitApi,
  setLessonCompletionApi,
} from './api';
import { queryKeys } from '../../api/query-keys';
import { useSessionStore } from '../../store/session';

export function useMyEnrollments(page: number = 0) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.learning.myEnrollments(page),
    queryFn: () => getMyEnrollmentsApi(page),
    enabled: isLoggedIn,
  });
}

export function useCourseLearnRoom(courseId: number) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.learning.courseProgress(courseId),
    queryFn: () => getCourseLearnRoomApi(courseId),
    enabled: isLoggedIn && Boolean(courseId),
  });
}

export function useLessonDetail(lessonId: number) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.learning.lessonDetail(lessonId),
    queryFn: () => getLessonDetailApi(lessonId),
    enabled: isLoggedIn && Boolean(lessonId),
  });
}

export function useRecordLessonVisit() {
  return useMutation({
    mutationFn: (lessonId: number) => recordLessonVisitApi(lessonId),
  });
}

export function useSetLessonCompletion(courseId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, completed }: { lessonId: number; completed: boolean }) =>
      setLessonCompletionApi(lessonId, completed),
    onSuccess: (data) => {
      // Invalidate lesson query
      if (data.lessonId !== undefined) {
        queryClient.invalidateQueries({ queryKey: queryKeys.learning.lessonDetail(data.lessonId) });
      }

      // Invalidate course learning room outline & progress
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.learning.courseProgress(courseId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['learning', 'course'] });
      }

      // Invalidate all learning & certificates queries so progressPercent & certs update
      queryClient.invalidateQueries({ queryKey: queryKeys.learning.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all });
    },
  });
}
