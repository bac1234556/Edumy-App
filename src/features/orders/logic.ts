// src/features/orders/logic.ts
// Pure business logic and status/cancelReason formatters for Orders (EDU-MOB-SRS-001).

import { components } from '../../api/schema';

export type OrderSummary = components['schemas']['OrderSummary'];
export type OrderDetail = components['schemas']['OrderDetail'];
export type OrderItem = components['schemas']['OrderItem'];

export interface OrderStatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

export function getOrderStatusConfig(status: 'pending' | 'paid' | 'cancelled' | string): OrderStatusConfig {
  switch (status) {
    case 'pending':
      return {
        label: 'Chờ thanh toán',
        color: '#D97706',
        backgroundColor: '#FEF3C7',
      };
    case 'paid':
      return {
        label: 'Đã thanh toán',
        color: '#059669',
        backgroundColor: '#D1FAE5',
      };
    case 'cancelled':
      return {
        label: 'Đã hủy',
        color: '#DC2626',
        backgroundColor: '#FEE2E2',
      };
    default:
      return {
        label: status,
        color: '#64748B',
        backgroundColor: '#F1F5F9',
      };
  }
}

export function getCancelReasonLabel(reason?: 'user' | 'replaced' | 'expired' | string | null): string | null {
  if (!reason) return null;

  switch (reason) {
    case 'user':
      return 'Người mua tự hủy';
    case 'expired':
      return 'Hết thời gian thanh toán';
    case 'replaced':
      return 'Thay thế bởi đơn hàng mới';
    default:
      return reason;
  }
}
