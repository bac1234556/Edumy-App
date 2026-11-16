// src/features/qa/logic.ts
// Pure business logic and validation for Q&A (Rules 40).

export interface QuestionValidationResult {
  valid: boolean;
  field?: 'title' | 'content';
  message?: string;
}

export function validateQuestionInput(title: string, content: string): QuestionValidationResult {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle) {
    return { valid: false, field: 'title', message: 'Vui lòng nhập tiêu đề câu hỏi' };
  }
  if (trimmedTitle.length > 200) {
    return {
      valid: false,
      field: 'title',
      message: 'Tiêu đề câu hỏi tối đa 200 ký tự',
    };
  }

  if (!trimmedContent) {
    return { valid: false, field: 'content', message: 'Vui lòng nhập nội dung chi tiết' };
  }
  if (trimmedContent.length > 5000) {
    return {
      valid: false,
      field: 'content',
      message: 'Nội dung câu hỏi tối đa 5000 ký tự',
    };
  }

  return { valid: true };
}

export function validateAnswerInput(content: string): QuestionValidationResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, field: 'content', message: 'Vui lòng nhập câu trả lời' };
  }
  if (trimmed.length > 5000) {
    return {
      valid: false,
      field: 'content',
      message: 'Câu trả lời tối đa 5000 ký tự',
    };
  }
  return { valid: true };
}

export function isQuestionReadOnly(status?: string): boolean {
  return status === 'hidden';
}
