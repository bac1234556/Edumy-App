// src/features/catalog/hooks.ts
// React Query hooks for courses, categories, reviews and free enrollments.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCoursesApi,
  getCategoriesApi,
  getCourseDetailApi,
  getCourseReviewsApi,
  getLessonPreviewApi,
  freeEnrollApi,
  CourseFilterParams,
} from './api';
import { queryKeys } from '../../api/query-keys';

export function useCourses(params: CourseFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.catalog.courses(params as Record<string, unknown>),
    queryFn: () => getCoursesApi(params),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.catalog.categories(),
    queryFn: () => getCategoriesApi(),
    staleTime: 1000 * 60 * 30,
  });
}

export function useCourseDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.catalog.courseDetail(slug),
    queryFn: () => getCourseDetailApi(slug),
    enabled: Boolean(slug),
  });
}

export function useCourseReviews(slug: string, page: number = 0) {
  return useQuery({
    queryKey: queryKeys.catalog.courseReviews(slug, page),
    queryFn: () => getCourseReviewsApi(slug, page),
    enabled: Boolean(slug),
  });
}

export function useLessonPreview(slug: string, lessonId: number) {
  return useQuery({
    queryKey: queryKeys.catalog.lessonPreview(slug, lessonId),
    queryFn: () => getLessonPreviewApi(slug, lessonId),
    enabled: Boolean(slug && lessonId),
  });
}

export function useFreeEnroll(courseSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: number) => freeEnrollApi(courseId),
    onSuccess: () => {
      if (courseSlug) {
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.courseDetail(courseSlug) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.learning.all });
    },
  });
}
