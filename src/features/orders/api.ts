// src/features/orders/api.ts
// Typed API fetchers for Orders (removed in Phase 3).

import { client } from '../../api/client';
import { Page, unwrap } from '../../api/envelope';

export interface OrderSummary {
  orderCode: string;
  totalAmount: number;
  status: string;
  cancelReason?: string;
  itemCount: number;
  createdAt: string;
  paidAt?: string;
  cancelledAt?: string;
}

export interface OrderDetailItem {
  courseId: number;
  title: string;
  slug: string;
  thumbnailUrl?: string;
  unitPrice: number;
}

export interface OrderPaymentItem {
  transactionRef?: string;
  amount: number;
  status: string;
  qrExpiresAt?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface OrderDetail {
  orderCode: string;
  totalAmount: number;
  status: string;
  cancelReason?: string;
  createdAt: string;
  paidAt?: string;
  cancelledAt?: string;
  items: OrderDetailItem[];
  payments?: OrderPaymentItem[];
}

export type OrdersListResponse = Page<OrderSummary>;

export async function getOrdersApi(page: number = 0): Promise<OrdersListResponse> {
  const response = await client.get('/orders', {
    params: { page, size: 20 },
  });
  return unwrap<OrdersListResponse>(response.data);
}

export async function getOrderDetailApi(orderCode: string): Promise<OrderDetail> {
  const response = await client.get(`/orders/${encodeURIComponent(orderCode)}`);
  return unwrap<OrderDetail>(response.data);
}
