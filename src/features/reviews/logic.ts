// src/features/reviews/logic.ts
// Pure business logic and validation for course reviews (AC-14, Rules 40).

export interface ReviewValidationResult {
  valid: boolean;
  field?: 'rating' | 'comment';
  message?: string;
}

export function validateReviewInput(rating: number, comment?: string): ReviewValidationResult {
  if (!rating || rating < 1 || rating > 5) {
    return {
      valid: false,
      field: 'rating',
      message: 'Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao)',
    };
  }

  if (comment && comment.trim().length > 2000) {
    return {
      valid: false,
      field: 'comment',
      message: 'Nhận xét tối đa 2000 ký tự',
    };
  }

  return { valid: true };
}

export function isReviewHiddenError(
  err: { status?: number; code?: string; message?: string } | null | undefined,
  hadVisibleReview: boolean = false
): boolean {
  if (!err) return false;
  if (err.code === 'REVIEW_HIDDEN_BY_ADMIN' || err.status === 409) {
    return true;
  }
  const msg = (err.message || '').toLowerCase();
  if (err.status === 403 && (msg.includes('ẩn') || msg.includes('quản trị viên'))) {
    return true;
  }
  if (!hadVisibleReview && err.status === 400 && msg.includes('đã gửi đánh giá')) {
    return true;
  }
  return false;
}
