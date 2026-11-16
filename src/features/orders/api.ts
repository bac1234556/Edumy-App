// src/features/orders/api.ts
// Typed API fetchers for Orders.

import { client } from '../../api/client';
import { components } from '../../api/schema';

export type OrderSummary = components['schemas']['OrderSummary'];
export type OrderDetail = components['schemas']['OrderDetail'];
export type PageMetadata = components['schemas']['PageMetadata'];

export interface OrdersListResponse {
  content: OrderSummary[];
  page: PageMetadata;
}

export async function getOrdersApi(page: number = 0): Promise<OrdersListResponse> {
  const response = await client.get<OrdersListResponse>('/orders', {
    params: { page, size: 20 },
  });
  const data = (response.data as { data?: OrdersListResponse }).data || response.data;
  return data;
}

export async function getOrderDetailApi(orderCode: string): Promise<OrderDetail> {
  const response = await client.get<OrderDetail>(`/orders/${encodeURIComponent(orderCode)}`);
  const data = (response.data as { data?: OrderDetail }).data || response.data;
  return data;
}
