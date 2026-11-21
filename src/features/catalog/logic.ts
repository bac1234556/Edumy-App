// src/features/catalog/logic.ts
// Pure business logic for catalog sorting and course action resolution (BR-MOBILE-SCOPE).

import type { CourseFilterParams } from './api';

export type CatalogSortOption = NonNullable<CourseFilterParams['sort']>;

export interface CatalogSortOptionItem {
  readonly value: CatalogSortOption;
  readonly label: string;
}

export const CATALOG_SORT_OPTIONS: readonly CatalogSortOptionItem[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
] as const;

export function getSortLabel(value: CatalogSortOption): string {
  return CATALOG_SORT_OPTIONS.find((option) => option.value === value)?.label ?? 'Mới nhất';
}

export interface CourseViewerState {
  owned?: boolean;
  isInstructor?: boolean;
}

export interface ResolveCourseActionInput {
  isLoggedIn: boolean;
  isFree: boolean;
  viewer?: CourseViewerState | null;
  lastAccessedLessonId?: number | null;
}

export type CoursePrimaryAction =
  | 'LOGIN_TO_ENROLL'
  | 'OPEN_LEARNING'
  | 'FREE_ENROLL'
  | 'BUY_ON_WEB'
  | null;

export interface CourseActionResult {
  primaryAction: CoursePrimaryAction;
  primaryLabel: string | null;
  notice?: string | null;
}

/**
 * Pure function resolving primary CTA on Course Detail screen (BR-MOBILE-SCOPE):
 * 1. isInstructor -> notice "Bạn là giảng viên khóa này" (no purchase/enroll CTA)
 * 2. owned        -> "Học tiếp" (if lastAccessedLessonId) or "Vào học"
 * 3. isFree & logged in  -> "Ghi danh miễn phí"
 * 4. isFree & anonymous  -> "Đăng nhập để ghi danh"
 * 5. paid & not owned    -> "Mua trên website"
 */
export function resolveCourseAction(input: ResolveCourseActionInput): CourseActionResult {
  const { isLoggedIn, isFree, viewer, lastAccessedLessonId } = input;

  if (viewer?.isInstructor) {
    return {
      primaryAction: null,
      primaryLabel: null,
      notice: 'Bạn là giảng viên khóa này',
    };
  }

  if (viewer?.owned) {
    return {
      primaryAction: 'OPEN_LEARNING',
      primaryLabel: lastAccessedLessonId ? 'Học tiếp' : 'Vào học',
    };
  }

  if (isFree) {
    if (!isLoggedIn) {
      return {
        primaryAction: 'LOGIN_TO_ENROLL',
        primaryLabel: 'Đăng nhập để ghi danh',
      };
    }
    return {
      primaryAction: 'FREE_ENROLL',
      primaryLabel: 'Ghi danh miễn phí',
    };
  }

  return {
    primaryAction: 'BUY_ON_WEB',
    primaryLabel: 'Mua trên website',
    notice: 'Khóa học trả phí được mua trên website',
  };
}
