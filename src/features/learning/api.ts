// src/features/learning/api.ts
// Typed API fetchers for Learning room, visits, and completion.

import { client } from '../../api/client';
import { components } from '../../api/schema';

export type Enrollment = components['schemas']['Enrollment'];
export type CourseLearnRoom = components['schemas']['CourseLearnRoom'];
export type LessonDetail = components['schemas']['LessonDetail'];
export type LessonCompletionResponse = components['schemas']['LessonCompletionResponse'];
export type PageMetadata = components['schemas']['PageMetadata'];

export interface EnrollmentsResponse {
  content: Enrollment[];
  page: PageMetadata;
}

export async function getMyEnrollmentsApi(page: number = 0): Promise<EnrollmentsResponse> {
  const response = await client.get<EnrollmentsResponse>('/me/enrollments', {
    params: { page, size: 20 },
  });
  const data = (response.data as { data?: EnrollmentsResponse }).data || response.data;
  return data;
}

export async function getCourseLearnRoomApi(courseId: number): Promise<CourseLearnRoom> {
  const response = await client.get<CourseLearnRoom>(`/learn/courses/${courseId}`);
  const data = (response.data as { data?: CourseLearnRoom }).data || response.data;
  return data;
}

export async function getLessonDetailApi(lessonId: number): Promise<LessonDetail> {
  const response = await client.get<LessonDetail>(`/learn/lessons/${lessonId}`);
  const data = (response.data as { data?: LessonDetail }).data || response.data;
  return data;
}

export async function recordLessonVisitApi(lessonId: number): Promise<void> {
  await client.post(`/learn/lessons/${lessonId}/visit`);
}

export async function setLessonCompletionApi(
  lessonId: number,
  completed: boolean
): Promise<LessonCompletionResponse> {
  const response = await client.put<LessonCompletionResponse>(
    `/learn/lessons/${lessonId}/completion`,
    { completed }
  );
  const data = (response.data as { data?: LessonCompletionResponse }).data || response.data;
  return data;
}
