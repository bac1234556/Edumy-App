// src/features/auth/api.ts
// Direct typed API calls for Authentication & User Profile.

import { client } from '../../api/client';
import { components } from '../../api/schema';
import axios from 'axios';
import { ENV } from '../../config/env';

export type MobileTokens = components['schemas']['MobileTokens'];
export type MobileLoginRequest = components['schemas']['MobileLoginRequest'];
export type MobileRegisterRequest = components['schemas']['MobileRegisterRequest'];
export type UserProfile = components['schemas']['UserProfile'];

export async function loginApi(data: MobileLoginRequest): Promise<MobileTokens> {
  const response = await client.post<MobileTokens>('/auth/mobile/login', data);
  const resData = (response.data as { data?: MobileTokens }).data || response.data;
  return resData;
}

export async function registerApi(data: MobileRegisterRequest): Promise<MobileTokens> {
  const response = await client.post<MobileTokens>('/auth/mobile/register', data);
  const resData = (response.data as { data?: MobileTokens }).data || response.data;
  return resData;
}

export async function refreshApi(refreshToken: string): Promise<MobileTokens> {
  const response = await axios.post<MobileTokens>(
    `${ENV.API_BASE_URL}/auth/mobile/refresh`,
    { refreshToken },
    { timeout: 15000 }
  );
  const resData = (response.data as { data?: MobileTokens }).data || response.data;
  return resData;
}

export async function logoutApi(refreshToken?: string | null): Promise<void> {
  try {
    await client.post('/auth/mobile/logout', {
      refreshToken: refreshToken || undefined,
    });
  } catch {
    // Logout API failure is ignored so client session is always cleared locally
  }
}

export async function getMeApi(): Promise<UserProfile> {
  const response = await client.get<UserProfile>('/me');
  const resData = (response.data as { data?: UserProfile }).data || response.data;
  return resData;
}

export async function forgotPasswordApi(email: string): Promise<void> {
  await client.post('/auth/password/forgot', { email });
}

export async function resendVerificationApi(): Promise<void> {
  await client.post('/auth/email-verification/resend');
}
