// src/features/instructor/hooks.ts
// React Query hooks for Instructor Earnings, Payout Account and Withdrawals.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEarningsSummaryApi,
  getMonthlyEarningsApi,
  getCourseEarningsApi,
  getEarningEntriesApi,
  getPayoutAccountApi,
  updatePayoutAccountApi,
  getWithdrawalsApi,
  requestWithdrawalApi,
  cancelWithdrawalApi,
  UpdatePayoutAccountInput,
} from './api';
import { queryKeys } from '../../api/query-keys';
import { useSessionStore } from '../../store/session';

export function useEarningsSummary() {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.earnings.summary,
    queryFn: () => getEarningsSummaryApi(),
    enabled: isLoggedIn,
  });
}

export function useMonthlyEarnings(year?: number) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.earnings.monthly(year),
    queryFn: () => getMonthlyEarningsApi(year),
    enabled: isLoggedIn,
  });
}

export function useCourseEarnings() {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.earnings.courses,
    queryFn: () => getCourseEarningsApi(),
    enabled: isLoggedIn,
  });
}

export function useEarningEntries(params: {
  courseId?: number;
  month?: string;
  page?: number;
} = {}) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.earnings.entries(params as Record<string, unknown>),
    queryFn: () => getEarningEntriesApi(params),
    enabled: isLoggedIn,
  });
}

export function usePayoutAccount() {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.earnings.payoutAccount,
    queryFn: () => getPayoutAccountApi(),
    enabled: isLoggedIn,
    retry: false, // 404 is normal when not created yet
  });
}

export function useUpdatePayoutAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePayoutAccountInput) => updatePayoutAccountApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.payoutAccount });
    },
  });
}

export function useWithdrawals(page: number = 0) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.earnings.withdrawals(page),
    queryFn: () => getWithdrawalsApi(page),
    enabled: isLoggedIn,
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => requestWithdrawalApi(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.summary });
      queryClient.invalidateQueries({ queryKey: ['earnings', 'withdrawals'] });
    },
  });
}

export function useCancelWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelWithdrawalApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.summary });
      queryClient.invalidateQueries({ queryKey: ['earnings', 'withdrawals'] });
    },
  });
}
