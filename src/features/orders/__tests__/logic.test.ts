// src/features/orders/__tests__/logic.test.ts
// Unit tests for orders status and cancelReason formatters.

import { getOrderStatusConfig, getCancelReasonLabel } from '../logic';

describe('Orders status formatting', () => {
  it('formats pending status', () => {
    const config = getOrderStatusConfig('pending');
    expect(config.label).toBe('Chờ thanh toán');
    expect(config.color).toBe('#D97706');
  });

  it('formats paid status', () => {
    const config = getOrderStatusConfig('paid');
    expect(config.label).toBe('Đã thanh toán');
    expect(config.color).toBe('#059669');
  });

  it('formats cancelled status', () => {
    const config = getOrderStatusConfig('cancelled');
    expect(config.label).toBe('Đã hủy');
    expect(config.color).toBe('#DC2626');
  });

  it('handles unknown status fallback', () => {
    const config = getOrderStatusConfig('refunded');
    expect(config.label).toBe('refunded');
  });
});

describe('Orders cancellation reason mapping', () => {
  it('maps user cancellation', () => {
    expect(getCancelReasonLabel('user')).toBe('Người mua tự hủy');
  });

  it('maps expired cancellation', () => {
    expect(getCancelReasonLabel('expired')).toBe('Hết thời gian thanh toán');
  });

  it('maps replaced cancellation', () => {
    expect(getCancelReasonLabel('replaced')).toBe('Thay thế bởi đơn hàng mới');
  });

  it('handles null / undefined / unknown', () => {
    expect(getCancelReasonLabel(null)).toBeNull();
    expect(getCancelReasonLabel(undefined)).toBeNull();
    expect(getCancelReasonLabel('custom_reason')).toBe('custom_reason');
  });
});
