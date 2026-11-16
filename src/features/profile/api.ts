// src/features/profile/api.ts
// Profile update, password change & email verification API endpoints.

import { client } from '../../api/client';
import { UserProfile } from '../auth/api';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function updateProfileApi(fullName: string): Promise<UserProfile> {
  const response = await client.patch<UserProfile>('/me', { fullName });
  const data = (response.data as { data?: UserProfile }).data || response.data;
  return data;
}

export async function changePasswordApi(data: ChangePasswordRequest): Promise<void> {
  await client.put('/me/password', data);
}

export async function resendVerificationEmailApi(): Promise<void> {
  await client.post('/auth/email-verification/resend');
}
