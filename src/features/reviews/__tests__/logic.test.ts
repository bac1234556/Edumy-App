// src/features/reviews/__tests__/logic.test.ts
// Unit tests for review inputs.

import { validateReviewInput } from '../logic';

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
