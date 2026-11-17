// src/features/learning/api.ts
// Typed API fetchers for Learning room, visits, and completion.

import { client } from '../../api/client';
import { unwrap } from '../../api/envelope';
import { components } from '../../api/schema';

export type Enrollment = components['schemas']['MobileEnrollmentDto'];
export type CourseLearnRoom = components['schemas']['LearnRoomDto'];
export type LessonDetail = components['schemas']['LearnLessonDetailDto'];
export type LessonCompletionResponse = components['schemas']['LessonCompletionResponseDto'];
export type PageMetadata = components['schemas']['PageMeta'];
export type EnrollmentsResponse = components['schemas']['PageResponseMobileEnrollmentDto'];

export async function getMyEnrollmentsApi(page: number = 0): Promise<EnrollmentsResponse> {
  const response = await client.get('/me/enrollments', {
    params: { page, size: 20 },
  });
  return unwrap<EnrollmentsResponse>(response.data);
}

export async function getCourseLearnRoomApi(courseId: number): Promise<CourseLearnRoom> {
  const response = await client.get(`/learn/courses/${courseId}`);
  return unwrap<CourseLearnRoom>(response.data);
}

export async function getLessonDetailApi(lessonId: number): Promise<LessonDetail> {
  const response = await client.get(`/learn/lessons/${lessonId}`);
  return unwrap<LessonDetail>(response.data);
}

export async function recordLessonVisitApi(lessonId: number): Promise<void> {
  await client.post(`/learn/lessons/${lessonId}/visit`);
}

export async function setLessonCompletionApi(
  lessonId: number,
  completed: boolean
): Promise<LessonCompletionResponse> {
  const body: components['schemas']['LessonCompletionRequest'] = { completed };
  const response = await client.put(`/learn/lessons/${lessonId}/completion`, body);
  return unwrap<LessonCompletionResponse>(response.data);
}
