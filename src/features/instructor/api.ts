// src/features/instructor/api.ts
// Typed API fetchers for Instructor Earnings, Payout Account and Withdrawals.

import { client } from '../../api/client';
import { PageMetadata } from '../catalog/api';

export interface EarningsSummary {
  hasEarnings: boolean;
  totalEarned: number;
  pendingBalance: number;
  inWithdrawal: number;
  withdrawn: number;
  availableBalance: number;
  minWithdrawal: number;
  maturityPolicy: 'monthly' | 'immediate' | string;
}

export interface MonthlyEarning {
  month: string; // "2026-11"
  amount: number;
  matured: boolean;
}

export interface CourseEarning {
  courseId: number;
  courseTitle: string;
  role: 'main' | 'co' | string;
  amount: number;
}

export interface EarningEntry {
  id: number;
  orderCode: string;
  courseId: number;
  courseTitle: string;
  role: 'main' | 'co' | string;
  unitPrice: number;
  platformFeeBps: number;
  shareBps: number;
  amount: number;
  earnedAt: string;
  maturesAt: string;
}

export interface EarningEntriesResponse {
  content: EarningEntry[];
  page: PageMetadata;
}

export interface PayoutAccount {
  bankName: string;
  accountNumberLast4: string;
  accountHolder: string;
  updatedAt?: string;
}

export interface UpdatePayoutAccountInput {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  currentPassword: string;
}

export interface WithdrawalRecord {
  id: number;
  amount: number;
  bankName: string;
  accountNumberLast4: string;
  accountHolder: string;
  status: 'requested' | 'paid' | 'rejected' | 'cancelled' | string;
  transferReference?: string;
  rejectReason?: string;
  createdAt: string;
  processedAt?: string;
}

export interface WithdrawalsResponse {
  content: WithdrawalRecord[];
  page: PageMetadata;
}

export async function getEarningsSummaryApi(): Promise<EarningsSummary> {
  const response = await client.get<EarningsSummary>('/me/earnings/summary');
  const data = (response.data as { data?: EarningsSummary }).data || response.data;
  return data;
}

export async function getMonthlyEarningsApi(year?: number): Promise<MonthlyEarning[]> {
  const response = await client.get<MonthlyEarning[]>('/me/earnings/monthly', {
    params: { year },
  });
  const data = (response.data as { data?: MonthlyEarning[] }).data || response.data;
  return data;
}

export async function getCourseEarningsApi(): Promise<CourseEarning[]> {
  const response = await client.get<CourseEarning[]>('/me/earnings/courses');
  const data = (response.data as { data?: CourseEarning[] }).data || response.data;
  return data;
}

export async function getEarningEntriesApi(params: {
  courseId?: number;
  month?: string;
  page?: number;
  size?: number;
} = {}): Promise<EarningEntriesResponse> {
  const response = await client.get<EarningEntriesResponse>('/me/earnings/entries', {
    params: { page: 0, size: 20, ...params },
  });
  const data = (response.data as { data?: EarningEntriesResponse }).data || response.data;
  return data;
}

export async function getPayoutAccountApi(): Promise<PayoutAccount> {
  const response = await client.get<PayoutAccount>('/me/payout-account');
  const data = (response.data as { data?: PayoutAccount }).data || response.data;
  return data;
}

export async function updatePayoutAccountApi(
  input: UpdatePayoutAccountInput
): Promise<PayoutAccount> {
  const response = await client.put<PayoutAccount>('/me/payout-account', input);
  const data = (response.data as { data?: PayoutAccount }).data || response.data;
  return data;
}

export async function getWithdrawalsApi(page: number = 0): Promise<WithdrawalsResponse> {
  const response = await client.get<WithdrawalsResponse>('/me/withdrawals', {
    params: { page, size: 20 },
  });
  const data = (response.data as { data?: WithdrawalsResponse }).data || response.data;
  return data;
}

export async function requestWithdrawalApi(amount: number): Promise<WithdrawalRecord> {
  const response = await client.post<WithdrawalRecord>('/me/withdrawals', { amount });
  const data = (response.data as { data?: WithdrawalRecord }).data || response.data;
  return data;
}

export async function cancelWithdrawalApi(id: number): Promise<void> {
  await client.post(`/me/withdrawals/${id}/cancel`);
}
