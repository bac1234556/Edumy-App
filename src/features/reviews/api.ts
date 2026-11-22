// src/features/reviews/api.ts
// Typed API fetchers for Reviews.

import { client } from '../../api/client';
import { unwrap } from '../../api/envelope';
import { components } from '../../api/schema';

export type SubmitReviewInput = components['schemas']['CreateReviewDto'];
export type CourseReviewResult = components['schemas']['Review'];

export async function submitReviewApi(
  courseId: number,
  input: SubmitReviewInput
): Promise<CourseReviewResult> {
  const response = await client.post(`/courses/${courseId}/reviews`, input);
  return unwrap<CourseReviewResult>(response.data);
}

export async function updateReviewApi(
  reviewId: number,
  input: SubmitReviewInput
): Promise<void> {
  await client.put(`/reviews/${reviewId}`, input);
}

export async function deleteReviewApi(reviewId: number): Promise<void> {
  await client.delete(`/reviews/${reviewId}`);
}
