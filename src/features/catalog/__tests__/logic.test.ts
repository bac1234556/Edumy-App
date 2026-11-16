// src/features/catalog/__tests__/logic.test.ts
// Unit tests for resolveCourseAction (Table D-M02) and video helper.

import { resolveCourseAction } from '../logic';
import { isNativeVideoUrl } from '../../../components/media/LessonContentViewer';

describe('resolveCourseAction (Table D-M02)', () => {
  // Row 1: Not logged in
  it('Row 1: Not logged in (paid course) returns LOGIN_TO_LEARN with web purchase notice', () => {
    const result = resolveCourseAction({
      isLoggedIn: false,
      isFree: false,
      viewer: null,
    });

    expect(result.primaryAction).toBe('LOGIN_TO_LEARN');
    expect(result.primaryLabel).toBe('Đăng nhập để học');
    expect(result.secondaryLabel).toBe('Mua trên website');
    expect(result.notice).toBe('Khóa học trả phí được mua trên website');
  });

  it('Row 1: Not logged in (free course) returns LOGIN_TO_LEARN without paid notice', () => {
    const result = resolveCourseAction({
      isLoggedIn: false,
      isFree: true,
      viewer: null,
    });

    expect(result.primaryAction).toBe('LOGIN_TO_LEARN');
    expect(result.primaryLabel).toBe('Đăng nhập để học');
    expect(result.secondaryLabel).toBeUndefined();
    expect(result.notice).toBeUndefined();
  });

  // Row 2: Instructor of the course
  it('Row 2: Instructor returns null primary action and instructor notice', () => {
    const result = resolveCourseAction({
      isLoggedIn: true,
      isFree: false,
      viewer: {
        isInstructor: true,
        owned: false,
        inCart: false,
      },
    });

    expect(result.primaryAction).toBeNull();
    expect(result.primaryLabel).toBeNull();
    expect(result.notice).toBe('Bạn là giảng viên của khóa này');
  });

  // Row 3: Already enrolled/owned
  it('Row 3: Enrolled/owned returns OPEN_LEARNING ("Vào học")', () => {
    const result = resolveCourseAction({
      isLoggedIn: true,
      isFree: false,
      viewer: {
        isInstructor: false,
        owned: true,
        inCart: false,
      },
    });

    expect(result.primaryAction).toBe('OPEN_LEARNING');
    expect(result.primaryLabel).toBe('Vào học');
  });

  // Row 4: Free course
  it('Row 4: Free course for logged in student returns FREE_ENROLL ("Ghi danh miễn phí")', () => {
    const result = resolveCourseAction({
      isLoggedIn: true,
      isFree: true,
      viewer: {
        isInstructor: false,
        owned: false,
        inCart: false,
      },
    });

    expect(result.primaryAction).toBe('FREE_ENROLL');
    expect(result.primaryLabel).toBe('Ghi danh miễn phí');
  });

  // Row 5: Paid course already in cart
  it('Row 5: Paid course already in cart returns ALREADY_IN_CART ("Đã có trong giỏ")', () => {
    const result = resolveCourseAction({
      isLoggedIn: true,
      isFree: false,
      viewer: {
        isInstructor: false,
        owned: false,
        inCart: true,
      },
    });

    expect(result.primaryAction).toBe('ALREADY_IN_CART');
    expect(result.primaryLabel).toBe('Đã có trong giỏ');
    expect(result.secondaryLabel).toBe('Mua trên website');
  });

  // Row 6: Paid course not in cart
  it('Row 6: Paid course not in cart returns ADD_TO_CART ("Thêm vào giỏ")', () => {
    const result = resolveCourseAction({
      isLoggedIn: true,
      isFree: false,
      viewer: {
        isInstructor: false,
        owned: false,
        inCart: false,
      },
    });

    expect(result.primaryAction).toBe('ADD_TO_CART');
    expect(result.primaryLabel).toBe('Thêm vào giỏ');
    expect(result.secondaryLabel).toBe('Mua trên website');
    expect(result.notice).toBe('Khóa học này được thanh toán trên website');
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
