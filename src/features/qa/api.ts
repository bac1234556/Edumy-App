// src/features/qa/api.ts
// Typed API fetchers for Q&A questions and answers.

import { client } from '../../api/client';
import { components } from '../../api/schema';

export type QuestionThread = components['schemas']['QuestionThread'];
export type QuestionAnswer = components['schemas']['QuestionAnswer'];
export type PageMetadata = components['schemas']['PageMetadata'];

export interface QuestionSummary {
  id: number;
  courseId: number;
  courseTitle: string;
  lessonId?: number;
  title: string;
  resolved: boolean;
  status: string;
  asker: {
    id: number;
    fullName: string;
  };
  answerCount: number;
  instructorReplied: boolean;
  createdAt: string;
}

export interface QuestionListResponse {
  content: QuestionSummary[];
  page: PageMetadata;
}

export interface CreateQuestionInput {
  title: string;
  content: string;
  lessonId?: number;
}

export async function getCourseQuestionsApi(
  courseId: number,
  page: number = 0
): Promise<QuestionListResponse> {
  const response = await client.get<QuestionListResponse>(`/courses/${courseId}/questions`, {
    params: { page, size: 20 },
  });
  const data = (response.data as { data?: QuestionListResponse }).data || response.data;
  return data;
}

export async function getQuestionDetailApi(id: number): Promise<QuestionThread> {
  const response = await client.get<QuestionThread>(`/questions/${id}`);
  const data = (response.data as { data?: QuestionThread }).data || response.data;
  return data;
}

export async function createQuestionApi(
  courseId: number,
  input: CreateQuestionInput
): Promise<QuestionThread> {
  const response = await client.post<QuestionThread>(`/courses/${courseId}/questions`, input);
  const data = (response.data as { data?: QuestionThread }).data || response.data;
  return data;
}

export async function resolveQuestionApi(
  id: number,
  resolved: boolean
): Promise<QuestionThread> {
  const response = await client.post<QuestionThread>(`/questions/${id}/resolve`, { resolved });
  const data = (response.data as { data?: QuestionThread }).data || response.data;
  return data;
}

export async function answerQuestionApi(
  id: number,
  content: string
): Promise<QuestionAnswer> {
  const response = await client.post<QuestionAnswer>(`/questions/${id}/answers`, { content });
  const data = (response.data as { data?: QuestionAnswer }).data || response.data;
  return data;
}

export async function deleteQuestionApi(id: number): Promise<void> {
  await client.delete(`/questions/${id}`);
}
