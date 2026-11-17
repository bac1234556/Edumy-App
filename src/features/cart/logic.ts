// src/features/cart/logic.ts
// Pure business logic and reason mapping for Cart (BR-M01, D-M06).

import { CartItem, Cart } from './api';

export type { CartItem, Cart };

export type UnavailableReasonCode =
  | 'course_unavailable'
  | 'already_owned'
  | 'own_course'
  | 'now_free';

export interface UnavailableReasonInfo {
  label: string;
  isNowFree: boolean;
}

/**
 * Returns human-readable Vietnamese message for unavailable cart items (BR-M01).
 */
export function getUnavailableReasonInfo(reason?: string | null): UnavailableReasonInfo | null {
  if (!reason) return null;

  switch (reason) {
    case 'course_unavailable':
      return {
        label: 'Khóa học không còn được bán',
        isNowFree: false,
      };
    case 'already_owned':
      return {
        label: 'Bạn đã sở hữu khóa học này',
        isNowFree: false,
      };
    case 'own_course':
      return {
        label: 'Bạn là giảng viên của khóa học này',
        isNowFree: false,
      };
    case 'now_free':
      return {
        label: 'Khóa học đã miễn phí',
        isNowFree: true,
      };
    default:
      return {
        label: 'Khóa học tạm thời không thể mua',
        isNowFree: false,
      };
  }
}

/**
 * Check if a cart item is ready for web purchase.
 */
export function isItemPurchasable(item: CartItem): boolean {
  return item.purchasable && !item.unavailableReason;
}
