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

export type InstructorOverview = components['schemas']['InstructorOverviewDto'];
export type InstructorCourse = components['schemas']['InstructorCourseDto'];
export type StudentRosterItem = components['schemas']['StudentRosterItemDto'];
export type StudentRosterResponse = components['schemas']['PageResponseStudentRosterItemDto'];
export type InstructorQuestionsResponse =
  components['schemas']['PageResponseQuestionSummaryResponse'];
export type InstructorQuestionItem = components['schemas']['QuestionSummaryResponse'];

export type CoInstructorInvitation = components['schemas']['CoInstructorInvitationDto'];
export type InvitationActionResponse = components['schemas']['InvitationActionResponse'];

export async function getInstructorOverviewApi(): Promise<InstructorOverview> {
  const response = await client.get('/instructor/overview');
  return unwrap<InstructorOverview>(response.data);
}

export async function getInstructorCoursesApi(): Promise<InstructorCourse[]> {
  const response = await client.get('/instructor/courses');
  return unwrap<InstructorCourse[]>(response.data);
}

export async function getInstructorCourseStudentsApi(
  courseId: number,
  page: number = 0
): Promise<StudentRosterResponse> {
  const response = await client.get(`/instructor/courses/${courseId}/students`, {
    params: { page, size: 20 },
  });
  const raw = unwrap<StudentRosterResponse>(response.data);
  return {
    ...raw,
    content: (raw.content ?? []).map((item) => {
      const sanitized = { ...item };
      delete sanitized.email;
      return sanitized;
    }),
  };
}

export async function getInstructorQuestionsApi(
  params: {
    courseId?: number;
    status?: 'unanswered' | 'all';
    page?: number;
    size?: number;
  } = {}
): Promise<InstructorQuestionsResponse> {
  const response = await client.get('/instructor/questions', {
    params: { page: 0, size: 20, ...params },
  });
  return unwrap<InstructorQuestionsResponse>(response.data);
}

export async function getInstructorInvitationsApi(): Promise<CoInstructorInvitation[]> {
  const response = await client.get('/instructor/invitations');
  return unwrap<CoInstructorInvitation[]>(response.data);
}

export async function acceptInvitationApi(invitationId: number): Promise<void> {
  await client.post(`/instructor/invitations/${invitationId}/accept`);
}

export async function declineInvitationApi(invitationId: number): Promise<void> {
  await client.post(`/instructor/invitations/${invitationId}/decline`);
}

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
