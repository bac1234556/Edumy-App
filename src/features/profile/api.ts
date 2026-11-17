// src/features/profile/api.ts
// Profile update, password change & email verification API endpoints.

import { client } from '../../api/client';
import { unwrap } from '../../api/envelope';
import { components } from '../../api/schema';
import { Me } from '../auth/api';

export type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];
export type UpdateMeRequest = components['schemas']['UpdateMeRequest'];

export async function updateProfileApi(fullName: string): Promise<Me> {
  const body: UpdateMeRequest = { fullName };
  const response = await client.patch('/me', body);
  return unwrap<Me>(response.data);
}

export async function changePasswordApi(data: ChangePasswordRequest): Promise<void> {
  await client.put('/me/password', data);
}

export async function resendVerificationEmailApi(): Promise<void> {
  await client.post('/auth/email-verification/resend');
}
