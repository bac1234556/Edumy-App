// src/features/qa/api.ts
// Typed API fetchers for Q&A questions and answers.

import { client } from '../../api/client';
import { unwrap } from '../../api/envelope';
import { components } from '../../api/schema';

export type QuestionSummaryDto = components['schemas']['QuestionSummaryResponse'];
export type PageMetadata = components['schemas']['PageMeta'];
export type CreateQuestionInput = components['schemas']['CreateQuestionRequest'];

export interface QuestionAnswer {
  id: number;
  content: string;
  author?: { id: number; fullName: string };
  authorType?: string;
  status?: string;
  createdAt: string;
}

export interface QuestionThread {
  id: number;
  courseId: number;
  lessonId?: number;
  title: string;
  content: string;
  resolved: boolean;
  status: string;
  asker?: { id: number; fullName: string };
  instructorReplied?: boolean;
  createdAt: string;
  answers?: QuestionAnswer[];
}

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

export async function getCourseQuestionsApi(
  courseId: number,
  page: number = 0
): Promise<QuestionListResponse> {
  const response = await client.get(`/courses/${courseId}/questions`, {
    params: { page, size: 20 },
  });
  return unwrap<QuestionListResponse>(response.data);
}

export async function getQuestionDetailApi(id: number): Promise<QuestionThread> {
  const response = await client.get(`/questions/${id}`);
  return unwrap<QuestionThread>(response.data);
}

export async function createQuestionApi(
  courseId: number,
  input: CreateQuestionInput
): Promise<QuestionThread> {
  const response = await client.post(`/courses/${courseId}/questions`, input);
  return unwrap<QuestionThread>(response.data);
}

export async function resolveQuestionApi(
  id: number,
  resolved: boolean
): Promise<QuestionThread> {
  const response = await client.post(`/questions/${id}/resolve`, { resolved });
  return unwrap<QuestionThread>(response.data);
}

export async function answerQuestionApi(
  id: number,
  content: string
): Promise<QuestionAnswer> {
  const response = await client.post(`/questions/${id}/answers`, { content });
  return unwrap<QuestionAnswer>(response.data);
}

export async function deleteQuestionApi(id: number): Promise<void> {
  await client.delete(`/questions/${id}`);
}
