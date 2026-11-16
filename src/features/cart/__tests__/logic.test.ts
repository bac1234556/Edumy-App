// src/features/cart/__tests__/logic.test.ts
// Unit tests for cart unavailable reasons and purchasability (BR-M01, D-M06).

import { getUnavailableReasonInfo, isItemPurchasable, CartItem } from '../logic';

describe('Cart unavailable reasons (BR-M01)', () => {
  it('maps course_unavailable correctly', () => {
    const info = getUnavailableReasonInfo('course_unavailable');
    expect(info).not.toBeNull();
    expect(info?.label).toBe('Khóa học không còn được bán');
    expect(info?.isNowFree).toBe(false);
  });

  it('maps already_owned correctly', () => {
    const info = getUnavailableReasonInfo('already_owned');
    expect(info).not.toBeNull();
    expect(info?.label).toBe('Bạn đã sở hữu khóa học này');
    expect(info?.isNowFree).toBe(false);
  });

  it('maps own_course correctly', () => {
    const info = getUnavailableReasonInfo('own_course');
    expect(info).not.toBeNull();
    expect(info?.label).toBe('Bạn là giảng viên của khóa học này');
    expect(info?.isNowFree).toBe(false);
  });

  it('maps now_free correctly and flags isNowFree=true', () => {
    const info = getUnavailableReasonInfo('now_free');
    expect(info).not.toBeNull();
    expect(info?.label).toBe('Khóa học đã miễn phí');
    expect(info?.isNowFree).toBe(true);
  });

  it('handles null / undefined / unknown reason', () => {
    expect(getUnavailableReasonInfo(null)).toBeNull();
    expect(getUnavailableReasonInfo(undefined)).toBeNull();

    const unknown = getUnavailableReasonInfo('some_other_code');
    expect(unknown?.label).toBe('Khóa học tạm thời không thể mua');
    expect(unknown?.isNowFree).toBe(false);
  });
});

describe('isItemPurchasable', () => {
  it('returns true when purchasable is true and unavailableReason is absent', () => {
    const item: CartItem = {
      courseId: 101,
      title: 'Khóa học mẫu',
      slug: 'khoa-hoc-mau',
      price: 299000,
      isFree: false,
      instructor: { id: 1, fullName: 'Giảng viên A' },
      addedAt: '2026-11-17T00:00:00Z',
      purchasable: true,
    };
    expect(isItemPurchasable(item)).toBe(true);
  });

  it('returns false when unavailableReason is present', () => {
    const item: CartItem = {
      courseId: 102,
      title: 'Khóa học đã miễn phí',
      slug: 'khoa-hoc-mien-phi',
      price: 0,
      isFree: true,
      instructor: { id: 1, fullName: 'Giảng viên A' },
      addedAt: '2026-11-17T00:00:00Z',
      purchasable: false,
      unavailableReason: 'now_free',
    };
    expect(isItemPurchasable(item)).toBe(false);
  });
});
