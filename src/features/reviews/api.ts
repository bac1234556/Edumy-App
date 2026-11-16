// src/features/reviews/api.ts
// Typed API fetchers for Reviews (AC-14).

import { client } from '../../api/client';

export interface SubmitReviewInput {
  rating: number;
  comment?: string;
}

export interface CourseReviewResult {
  id: number;
  courseId: number;
  rating: number;
  comment?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export async function submitReviewApi(
  courseId: number,
  input: SubmitReviewInput
): Promise<CourseReviewResult> {
  const response = await client.post<CourseReviewResult>(`/courses/${courseId}/reviews`, input);
  const data = (response.data as { data?: CourseReviewResult }).data || response.data;
  return data;
}

export async function deleteReviewApi(reviewId: number): Promise<void> {
  await client.delete(`/reviews/${reviewId}`);
}
