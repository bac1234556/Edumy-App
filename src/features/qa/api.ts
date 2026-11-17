// src/features/qa/api.ts
// Typed API fetchers for Q&A questions and answers (v2).

import { client } from '../../api/client';
import { Page, PageMeta, unwrap } from '../../api/envelope';
import { components } from '../../api/schema';

export type QuestionSummary = components['schemas']['QuestionSummaryResponse'];
export type PageMetadata = PageMeta;
export type CreateQuestionInput = components['schemas']['CreateQuestionRequest'];
export type CreateAnswerInput = components['schemas']['CreateAnswerRequest'];
export type QuestionListResponse = Page<QuestionSummary>;

export interface QuestionAnswer {
  id: number;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
  authorType?: string;
  content: string;
  visibilityStatus?: string;
  createdAt: string;
}

export interface QuestionThread {
  id: number;
  courseId: number;
  courseTitle?: string;
  lessonId?: number;
  title: string;
  content: string;
  askerId?: number;
  askerName?: string;
  askerAvatar?: string;
  isResolved: boolean;
  visibilityStatus?: string;
  createdAt: string;
  answers: QuestionAnswer[];
}

function normalizeQuestionPage(raw: unknown): QuestionListResponse {
  if (!raw || typeof raw !== 'object') {
    return { content: [], page: { number: 0, size: 20, totalElements: 0, totalPages: 0 } };
  }
  const obj = raw as Record<string, unknown>;
  const content = Array.isArray(obj.content) ? (obj.content as QuestionSummary[]) : [];
  if (obj.page && typeof obj.page === 'object') {
    return { content, page: obj.page as PageMeta };
  }
  return {
    content,
    page: {
      number: typeof obj.number === 'number' ? obj.number : 0,
      size: typeof obj.size === 'number' ? obj.size : 20,
      totalElements: typeof obj.totalElements === 'number' ? obj.totalElements : content.length,
      totalPages: typeof obj.totalPages === 'number' ? obj.totalPages : 1,
    },
  };
}

export async function getCourseQuestionsApi(
  courseId: number,
  page: number = 0,
  filters: {
    lessonId?: number;
    mineOnly?: boolean;
    unansweredOnly?: boolean;
    q?: string;
  } = {}
): Promise<QuestionListResponse> {
  const response = await client.get(`/courses/${courseId}/questions`, {
    params: { page, size: 20, ...filters },
  });
  return normalizeQuestionPage(unwrap<unknown>(response.data));
}

export async function getQuestionDetailApi(id: number): Promise<QuestionThread> {
  const response = await client.get(`/questions/${id}`);
  return unwrap<QuestionThread>(response.data);
}

export async function createQuestionApi(
  courseId: number,
  input: CreateQuestionInput
): Promise<QuestionSummary> {
  const response = await client.post(`/courses/${courseId}/questions`, input);
  return unwrap<QuestionSummary>(response.data);
}

export async function resolveQuestionApi(
  id: number,
  resolved: boolean
): Promise<QuestionSummary> {
  const response = await client.post(`/questions/${id}/resolve`, { resolved });
  return unwrap<QuestionSummary>(response.data);
}

export async function answerQuestionApi(
  id: number,
  content: string
): Promise<QuestionAnswer> {
  const body: CreateAnswerInput = { content };
  const response = await client.post(`/questions/${id}/answers`, body);
  return unwrap<QuestionAnswer>(response.data);
}

export async function deleteQuestionApi(id: number): Promise<void> {
  await client.delete(`/questions/${id}`);
}
