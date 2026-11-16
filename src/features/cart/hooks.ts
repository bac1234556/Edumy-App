// src/features/cart/hooks.ts
// React Query hooks for Cart.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCartApi, addToCartApi, removeFromCartApi } from './api';
import { queryKeys } from '../../api/query-keys';
import { useSessionStore } from '../../store/session';

export function useCart() {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.cart.current,
    queryFn: () => getCartApi(),
    enabled: isLoggedIn,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: number) => addToCartApi(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: number) => removeFromCartApi(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
    },
  });
}
