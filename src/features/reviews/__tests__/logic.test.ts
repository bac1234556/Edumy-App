// src/features/reviews/__tests__/logic.test.ts
// Unit tests for review inputs.

import { validateReviewInput, isReviewHiddenError } from '../logic';

describe('validateReviewInput', () => {
  it('rejects rating below 1 or above 5', () => {
    expect(validateReviewInput(0).valid).toBe(false);
    expect(validateReviewInput(6).valid).toBe(false);
    expect(validateReviewInput(-1).valid).toBe(false);
  });

  it('rejects comment longer than 2000 characters', () => {
    const longComment = 'x'.repeat(2001);
    const res = validateReviewInput(5, longComment);
    expect(res.valid).toBe(false);
    expect(res.field).toBe('comment');
    expect(res.message).toContain('2000 ký tự');
  });

  it('accepts rating without comment', () => {
    const res = validateReviewInput(5);
    expect(res.valid).toBe(true);
  });

  it('accepts rating with valid comment', () => {
    const res = validateReviewInput(4, 'Khóa học giảng dạy rất chi tiết và dễ hiểu.');
    expect(res.valid).toBe(true);
  });
});

describe('isReviewHiddenError', () => {
  it('recognizes explicit REVIEW_HIDDEN_BY_ADMIN code or 409 status', () => {
    expect(isReviewHiddenError({ code: 'REVIEW_HIDDEN_BY_ADMIN', status: 403 })).toBe(true);
    expect(isReviewHiddenError({ status: 409 })).toBe(true);
  });

  it('recognizes 403 forbidden from PUT /reviews/{id} when hidden by Admin', () => {
    expect(
      isReviewHiddenError({
        status: 403,
        code: 'FORBIDDEN',
        message: 'Đánh giá này đã bị ẩn bởi Quản trị viên và không thể chỉnh sửa.',
      })
    ).toBe(true);
  });

  it('recognizes 400 duplicate review on POST /courses/{id}/reviews when absent from visible reviews', () => {
    expect(
      isReviewHiddenError(
        {
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Bạn đã gửi đánh giá cho khóa học này rồi.',
        },
        false
      )
    ).toBe(true);
    expect(
      isReviewHiddenError(
        {
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Bạn đã gửi đánh giá cho khóa học này rồi.',
        },
        true
      )
    ).toBe(false);
  });
});
