// src/features/catalog/api.ts
// Typed API fetchers for Catalog, Course Detail, Reviews & Free Enrollments.

import { client } from '../../api/client';
import { components } from '../../api/schema';

export type CourseCard = components['schemas']['CourseCard'];
export type CourseDetail = components['schemas']['CourseDetail'];
export type PageMetadata = components['schemas']['PageMetadata'];

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

export interface CourseFilterParams {
  q?: string;
  categoryId?: number;
  price?: 'free' | 'paid';
  sort?: 'newest' | 'rating' | 'price_asc' | 'price_desc';
  page?: number;
  size?: number;
}

export interface CourseCatalogResponse {
  content: CourseCard[];
  page: PageMetadata;
  suggestions?: CourseCard[];
}

export interface CourseReviewItem {
  id: number;
  rating: number;
  comment?: string;
  reviewerName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CourseReviewsResponse {
  content: CourseReviewItem[];
  page: PageMetadata;
}

export interface LessonPreviewDetail {
  id: number;
  courseSlug: string;
  courseTitle: string;
  chapterTitle?: string;
  title: string;
  contentType: 'video' | 'article';
  videoUrl?: string;
  articleContent?: string;
  durationSeconds?: number;
}

export async function getCoursesApi(params: CourseFilterParams = {}): Promise<CourseCatalogResponse> {
  const response = await client.get<CourseCatalogResponse>('/catalog/courses', { params });
  const data = (response.data as { data?: CourseCatalogResponse }).data || response.data;
  return data;
}

export async function getCategoriesApi(): Promise<CategoryItem[]> {
  const response = await client.get<CategoryItem[]>('/catalog/categories');
  const data = (response.data as { data?: CategoryItem[] }).data || response.data;
  return data;
}

export async function getCourseDetailApi(slug: string): Promise<CourseDetail> {
  const response = await client.get<CourseDetail>(`/catalog/courses/${encodeURIComponent(slug)}`);
  const data = (response.data as { data?: CourseDetail }).data || response.data;
  return data;
}

export async function getCourseReviewsApi(slug: string, page: number = 0): Promise<CourseReviewsResponse> {
  const response = await client.get<CourseReviewsResponse>(`/catalog/courses/${encodeURIComponent(slug)}/reviews`, {
    params: { page, size: 10 },
  });
  const data = (response.data as { data?: CourseReviewsResponse }).data || response.data;
  return data;
}

export async function getLessonPreviewApi(slug: string, lessonId: number): Promise<LessonPreviewDetail> {
  const response = await client.get<LessonPreviewDetail>(
    `/catalog/courses/${encodeURIComponent(slug)}/lessons/${lessonId}/preview`
  );
  const data = (response.data as { data?: LessonPreviewDetail }).data || response.data;
  return data;
}

export async function freeEnrollApi(courseId: number): Promise<{ id: number; courseId: number }> {
  const response = await client.post<{ id: number; courseId: number }>(`/courses/${courseId}/enrollments`);
  const data = (response.data as { data?: { id: number; courseId: number } }).data || response.data;
  return data;
}

export async function addToCartApi(courseId: number): Promise<unknown> {
  const response = await client.post('/cart/items', { courseId });
  const data = (response.data as { data?: unknown }).data || response.data;
  return data;
}
