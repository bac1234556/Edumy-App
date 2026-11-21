// src/features/catalog/__tests__/logic.test.ts
// Unit tests for catalog sort helpers, resolveCourseAction (BR-MOBILE-SCOPE) and video helper.

import {
  CATALOG_SORT_OPTIONS,
  getSortLabel,
  resolveCourseAction,
} from '../logic';
import type { CourseFilterParams } from '../api';
import { isNativeVideoUrl } from '../../../components/media/LessonContentViewer';

describe('CATALOG_SORT_OPTIONS & getSortLabel', () => {
  it('contains all 4 sort options matching CourseFilterParams["sort"]', () => {
    const expectedValues: NonNullable<CourseFilterParams['sort']>[] = [
      'newest',
      'rating',
      'price_asc',
      'price_desc',
    ];

    expect(CATALOG_SORT_OPTIONS).toHaveLength(4);
    expect(CATALOG_SORT_OPTIONS.map((item) => item.value)).toEqual(expectedValues);
  });

  it('returns the exact Vietnamese label for each sort value', () => {
    expect(getSortLabel('newest')).toBe('Mới nhất');
    expect(getSortLabel('rating')).toBe('Đánh giá cao');
    expect(getSortLabel('price_asc')).toBe('Giá tăng dần');
    expect(getSortLabel('price_desc')).toBe('Giá giảm dần');
  });
});

describe('resolveCourseAction (BR-MOBILE-SCOPE)', () => {
  it('returns null action and instructor notice when viewer is instructor', () => {
    const result = resolveCourseAction({
      isLoggedIn: true,
      isFree: false,
      viewer: {
        isInstructor: true,
        owned: false,
      },
    });

    expect(result.primaryAction).toBeNull();
    expect(result.primaryLabel).toBeNull();
    expect(result.notice).toBe('Bạn là giảng viên khóa này');
  });

  it('returns OPEN_LEARNING ("Vào học") when owned without lastAccessedLessonId', () => {
    const result = resolveCourseAction({
      isLoggedIn: true,
      isFree: false,
      viewer: {
        isInstructor: false,
        owned: true,
      },
    });

    expect(result.primaryAction).toBe('OPEN_LEARNING');
    expect(result.primaryLabel).toBe('Vào học');
  });

  it('returns OPEN_LEARNING ("Học tiếp") when owned with lastAccessedLessonId', () => {
    const result = resolveCourseAction({
      isLoggedIn: true,
      isFree: false,
      viewer: {
        isInstructor: false,
        owned: true,
      },
      lastAccessedLessonId: 42,
    });

    expect(result.primaryAction).toBe('OPEN_LEARNING');
    expect(result.primaryLabel).toBe('Học tiếp');
  });

  it('returns FREE_ENROLL for logged-in user on free course', () => {
    const result = resolveCourseAction({
      isLoggedIn: true,
      isFree: true,
      viewer: {
        isInstructor: false,
        owned: false,
      },
    });

    expect(result.primaryAction).toBe('FREE_ENROLL');
    expect(result.primaryLabel).toBe('Ghi danh miễn phí');
  });

  it('returns LOGIN_TO_ENROLL for anonymous user on free course', () => {
    const result = resolveCourseAction({
      isLoggedIn: false,
      isFree: true,
      viewer: null,
    });

    expect(result.primaryAction).toBe('LOGIN_TO_ENROLL');
    expect(result.primaryLabel).toBe('Đăng nhập để ghi danh');
  });

  it('returns BUY_ON_WEB for paid course when anonymous or not owned', () => {
    const anonResult = resolveCourseAction({
      isLoggedIn: false,
      isFree: false,
      viewer: null,
    });
    expect(anonResult.primaryAction).toBe('BUY_ON_WEB');
    expect(anonResult.primaryLabel).toBe('Mua trên website');

    const loggedInResult = resolveCourseAction({
      isLoggedIn: true,
      isFree: false,
      viewer: { owned: false, isInstructor: false },
    });
    expect(loggedInResult.primaryAction).toBe('BUY_ON_WEB');
    expect(loggedInResult.primaryLabel).toBe('Mua trên website');
  });
});

describe('isNativeVideoUrl', () => {
  it('returns true for .mp4 and .m3u8 URLs', () => {
    expect(isNativeVideoUrl('https://example.com/video.mp4')).toBe(true);
    expect(isNativeVideoUrl('https://example.com/stream.m3u8')).toBe(true);
    expect(isNativeVideoUrl('https://example.com/video.mp4?token=abc123xyz')).toBe(true);
  });

  it('returns false for web or non-native URLs', () => {
    expect(isNativeVideoUrl('https://youtube.com/watch?v=12345')).toBe(false);
    expect(isNativeVideoUrl('https://vimeo.com/12345')).toBe(false);
    expect(isNativeVideoUrl(undefined)).toBe(false);
    expect(isNativeVideoUrl(null)).toBe(false);
  });
});
