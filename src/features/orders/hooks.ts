// src/features/orders/hooks.ts
// React Query hooks for Orders.

import { useQuery } from '@tanstack/react-query';
import { getOrdersApi, getOrderDetailApi } from './api';
import { queryKeys } from '../../api/query-keys';
import { useSessionStore } from '../../store/session';

export function useOrders(page: number = 0) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.orders.all(page),
    queryFn: () => getOrdersApi(page),
    enabled: isLoggedIn,
  });
}

export function useOrderDetail(orderCode: string) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.orders.detail(orderCode),
    queryFn: () => getOrderDetailApi(orderCode),
    enabled: isLoggedIn && Boolean(orderCode),
  });
}
