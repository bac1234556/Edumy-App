// src/features/qa/__tests__/logic.test.ts
// Unit tests for Q&A validation and read-only status checks.

import { validateQuestionInput, validateAnswerInput, isQuestionReadOnly } from '../logic';

describe('validateQuestionInput', () => {
  it('rejects empty or whitespace-only title', () => {
    const res = validateQuestionInput('   ', 'Có nội dung');
    expect(res.valid).toBe(false);
    expect(res.field).toBe('title');
  });

  it('rejects title longer than 200 characters', () => {
    const longTitle = 'a'.repeat(201);
    const res = validateQuestionInput(longTitle, 'Có nội dung');
    expect(res.valid).toBe(false);
    expect(res.field).toBe('title');
    expect(res.message).toContain('200 ký tự');
  });

  it('rejects empty or whitespace-only content', () => {
    const res = validateQuestionInput('Tiêu đề hợp lệ', '   ');
    expect(res.valid).toBe(false);
    expect(res.field).toBe('content');
  });

  it('rejects content longer than 5000 characters', () => {
    const longContent = 'b'.repeat(5001);
    const res = validateQuestionInput('Tiêu đề hợp lệ', longContent);
    expect(res.valid).toBe(false);
    expect(res.field).toBe('content');
    expect(res.message).toContain('5000 ký tự');
  });

  it('accepts valid title and content', () => {
    const res = validateQuestionInput(
      'Làm thế nào để cấu hình Redux Store?',
      'Em đang gặp lỗi khi dispatch action.'
    );
    expect(res.valid).toBe(true);
  });
});

describe('validateAnswerInput', () => {
  it('rejects empty answer', () => {
    const res = validateAnswerInput('   ');
    expect(res.valid).toBe(false);
    expect(res.field).toBe('content');
  });

  it('rejects answer longer than 5000 characters', () => {
    const res = validateAnswerInput('c'.repeat(5001));
    expect(res.valid).toBe(false);
    expect(res.message).toContain('5000 ký tự');
  });

  it('accepts valid answer', () => {
    const res = validateAnswerInput('Bạn cần bọc Provider ở root layout.');
    expect(res.valid).toBe(true);
  });
});

describe('isQuestionReadOnly', () => {
  it('returns true when status is hidden or HIDDEN', () => {
    expect(isQuestionReadOnly('hidden')).toBe(true);
    expect(isQuestionReadOnly('HIDDEN')).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(isQuestionReadOnly('active')).toBe(false);
    expect(isQuestionReadOnly('published')).toBe(false);
    expect(isQuestionReadOnly(undefined)).toBe(false);
  });
});
