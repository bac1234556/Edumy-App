// src/features/instructor/api.ts
// Typed API fetchers for Instructor Channel, Earnings, Payout Account and Withdrawals.

import { client } from '../../api/client';
import { unwrap } from '../../api/envelope';
import { components } from '../../api/schema';

export type EarningsSummary = components['schemas']['EarningSummaryDto'];
export type MonthlyEarning = components['schemas']['MonthlyEarningDto'];
export type CourseEarning = components['schemas']['CourseEarningDto'];
export type EarningEntry = components['schemas']['EarningEntryDto'];
export type EarningEntriesResponse = components['schemas']['PageResponseEarningEntryDto'];
export type PayoutAccount = components['schemas']['PayoutAccountDto'];
export type UpdatePayoutAccountInput = components['schemas']['UpdatePayoutAccountRequest'];
export type WithdrawalRecord = components['schemas']['WithdrawalResponseDto'];
export type WithdrawalsResponse = components['schemas']['PageResponseWithdrawalResponseDto'];

export async function getEarningsSummaryApi(): Promise<EarningsSummary> {
  const response = await client.get('/me/earnings/summary');
  return unwrap<EarningsSummary>(response.data);
}

export async function getMonthlyEarningsApi(year?: number): Promise<MonthlyEarning[]> {
  const response = await client.get('/me/earnings/monthly', {
    params: { year },
  });
  return unwrap<MonthlyEarning[]>(response.data);
}

export async function getCourseEarningsApi(): Promise<CourseEarning[]> {
  const response = await client.get('/me/earnings/courses');
  return unwrap<CourseEarning[]>(response.data);
}

export async function getEarningEntriesApi(
  params: {
    courseId?: number;
    month?: string;
    page?: number;
    size?: number;
  } = {}
): Promise<EarningEntriesResponse> {
  const response = await client.get('/me/earnings/entries', {
    params: { page: 0, size: 20, ...params },
  });
  return unwrap<EarningEntriesResponse>(response.data);
}

export async function getPayoutAccountApi(): Promise<PayoutAccount> {
  const response = await client.get('/me/payout-account');
  return unwrap<PayoutAccount>(response.data);
}

export async function updatePayoutAccountApi(
  input: UpdatePayoutAccountInput
): Promise<PayoutAccount> {
  const response = await client.put('/me/payout-account', input);
  return unwrap<PayoutAccount>(response.data);
}

export async function getWithdrawalsApi(page: number = 0): Promise<WithdrawalsResponse> {
  const response = await client.get('/me/withdrawals', {
    params: { page, size: 20 },
  });
  return unwrap<WithdrawalsResponse>(response.data);
}

export async function requestWithdrawalApi(amount: number): Promise<WithdrawalRecord> {
  const body: components['schemas']['WithdrawalRequestDto'] = { amount };
  const response = await client.post('/me/withdrawals', body);
  return unwrap<WithdrawalRecord>(response.data);
}

export async function cancelWithdrawalApi(id: number): Promise<void> {
  await client.post(`/me/withdrawals/${id}/cancel`);
}
