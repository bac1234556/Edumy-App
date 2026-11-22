// src/features/reviews/hooks.ts
// React Query hooks for reviews.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitReviewApi, updateReviewApi, deleteReviewApi, SubmitReviewInput } from './api';
import { queryKeys } from '../../api/query-keys';

export function useSubmitReview(courseSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: number; input: SubmitReviewInput }) =>
      submitReviewApi(courseId, input),
    onSuccess: () => {
      if (courseSlug) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.catalog.courseDetail(courseSlug),
        });
        queryClient.invalidateQueries({
          queryKey: ['catalog', 'course', courseSlug, 'reviews'],
        });
      }
    },
  });
}

export function useUpdateReview(courseSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, input }: { reviewId: number; input: SubmitReviewInput }) =>
      updateReviewApi(reviewId, input),
    onSuccess: () => {
      if (courseSlug) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.catalog.courseDetail(courseSlug),
        });
        queryClient.invalidateQueries({
          queryKey: ['catalog', 'course', courseSlug, 'reviews'],
        });
      }
    },
  });
}

export function useDeleteReview(courseSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: number) => deleteReviewApi(reviewId),
    onSuccess: () => {
      if (courseSlug) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.catalog.courseDetail(courseSlug),
        });
        queryClient.invalidateQueries({
          queryKey: ['catalog', 'course', courseSlug, 'reviews'],
        });
      }
    },
  });
}
