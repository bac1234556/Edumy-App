// src/features/catalog/api.ts
// Typed API fetchers for Catalog, Course Detail, Reviews & Free Enrollments.

import { client } from '../../api/client';
import { unwrap } from '../../api/envelope';
import { components } from '../../api/schema';

export type CourseCard = components['schemas']['CourseCardDto'];
export type CourseDetail = components['schemas']['CourseDetailDto'];
export type PageMetadata = components['schemas']['PageMeta'];
export type CategoryItem = components['schemas']['CategoryDto'];
export type CourseCatalogResponse = components['schemas']['CatalogCoursePageDto'];
export type CourseReviewItem = components['schemas']['CatalogReviewDto'];
export type CourseReviewsResponse = components['schemas']['PageResponseCatalogReviewDto'];
export type LessonPreviewDetail = components['schemas']['LessonContentDto'];
export type EnrollmentCreated = components['schemas']['EnrollmentCreatedDto'];

export interface CourseFilterParams {
  q?: string;
  categoryId?: number;
  price?: 'free' | 'paid';
  sort?: 'newest' | 'rating' | 'price_asc' | 'price_desc';
  page?: number;
  size?: number;
}

export async function getCoursesApi(
  params: CourseFilterParams = {}
): Promise<CourseCatalogResponse> {
  const response = await client.get('/catalog/courses', { params });
  return unwrap<CourseCatalogResponse>(response.data);
}

export async function getCategoriesApi(): Promise<CategoryItem[]> {
  const response = await client.get('/catalog/categories');
  return unwrap<CategoryItem[]>(response.data);
}

export async function getCourseDetailApi(slug: string): Promise<CourseDetail> {
  const response = await client.get(`/catalog/courses/${encodeURIComponent(slug)}`);
  return unwrap<CourseDetail>(response.data);
}

export async function getCourseReviewsApi(
  slug: string,
  page: number = 0
): Promise<CourseReviewsResponse> {
  const response = await client.get(`/catalog/courses/${encodeURIComponent(slug)}/reviews`, {
    params: { page, size: 10 },
  });
  return unwrap<CourseReviewsResponse>(response.data);
}

export async function getLessonPreviewApi(
  slug: string,
  lessonId: number
): Promise<LessonPreviewDetail> {
  const response = await client.get(
    `/catalog/courses/${encodeURIComponent(slug)}/lessons/${lessonId}/preview`
  );
  return unwrap<LessonPreviewDetail>(response.data);
}

export async function freeEnrollApi(courseId: number): Promise<EnrollmentCreated> {
  const response = await client.post(`/courses/${courseId}/enrollments`);
  return unwrap<EnrollmentCreated>(response.data);
}

export async function addToCartApi(courseId: number): Promise<unknown> {
  const response = await client.post('/cart/items', { courseId });
  return unwrap<unknown>(response.data);
}
