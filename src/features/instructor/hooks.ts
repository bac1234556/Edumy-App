// src/features/instructor/hooks.ts
// React Query hooks for Instructor Channel, Earnings, Payout Account and Withdrawals.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  acceptInvitationApi,
  cancelWithdrawalApi,
  declineInvitationApi,
  getCourseEarningsApi,
  getEarningEntriesApi,
  getEarningsSummaryApi,
  getInstructorCourseStudentsApi,
  getInstructorCoursesApi,
  getInstructorInvitationsApi,
  getInstructorOverviewApi,
  getInstructorQuestionsApi,
  getMonthlyEarningsApi,
  getPayoutAccountApi,
  getWithdrawalsApi,
  requestWithdrawalApi,
  updatePayoutAccountApi,
  UpdatePayoutAccountInput,
} from './api';
import { queryKeys } from '../../api/query-keys';
import { useSessionStore } from '../../store/session';

export function useInstructorOverview(enabled: boolean = true) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.instructor.overview(),
    queryFn: () => getInstructorOverviewApi(),
    enabled: isLoggedIn && enabled,
  });
}

export function useInstructorCourses(enabled: boolean = true) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.instructor.courses(),
    queryFn: () => getInstructorCoursesApi(),
    enabled: isLoggedIn && enabled,
  });
}

export function useInfiniteInstructorCourseStudents(courseId: number) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useInfiniteQuery({
    queryKey: ['instructor', 'courses', courseId, 'students', 'infinite'] as const,
    queryFn: ({ pageParam }) => getInstructorCourseStudentsApi(courseId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const current = lastPage.page?.number ?? 0;
      const total = lastPage.page?.totalPages ?? 0;
      return current + 1 < total ? current + 1 : undefined;
    },
    enabled: isLoggedIn && Boolean(courseId),
  });
}

export function useInstructorQuestions(
  statusFilter: 'unanswered' | 'all' = 'unanswered',
  courseId?: number,
  enabled: boolean = true
) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useInfiniteQuery({
    queryKey: queryKeys.instructor.questions({ status: statusFilter, courseId }),
    queryFn: ({ pageParam }) =>
      getInstructorQuestionsApi({ status: statusFilter, courseId, page: pageParam, size: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const current = lastPage.page?.number ?? 0;
      const total = lastPage.page?.totalPages ?? 0;
      return current + 1 < total ? current + 1 : undefined;
    },
    enabled: isLoggedIn && enabled,
  });
}

export function useInstructorInvitations(enabled: boolean = true) {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useQuery({
    queryKey: queryKeys.instructor.invitations(),
    queryFn: () => getInstructorInvitationsApi(),
    enabled: isLoggedIn && enabled,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: number) => acceptInvitationApi(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.all });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: number) => declineInvitationApi(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor.all });
    },
  });
}

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

export function useEarningEntries(
  params: {
    courseId?: number;
    month?: string;
    page?: number;
  } = {}
) {
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

export function useInfiniteWithdrawals() {
  const { status } = useSessionStore();
  const isLoggedIn = status === 'authenticated';

  return useInfiniteQuery({
    queryKey: ['earnings', 'withdrawals', 'infinite'] as const,
    queryFn: ({ pageParam }) => getWithdrawalsApi(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const current = lastPage.page?.number ?? 0;
      const total = lastPage.page?.totalPages ?? 0;
      return current + 1 < total ? current + 1 : undefined;
    },
    enabled: isLoggedIn,
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => requestWithdrawalApi(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor.all });
    },
  });
}

export function useCancelWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelWithdrawalApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor.all });
    },
  });
}
