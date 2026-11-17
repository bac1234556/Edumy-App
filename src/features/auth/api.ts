// src/features/auth/api.ts
// Direct typed API calls for Authentication & User Profile.

import axios from 'axios';
import { client } from '../../api/client';
import { unwrap } from '../../api/envelope';
import { components } from '../../api/schema';
import { ENV } from '../../config/env';

export type MobileTokens = components['schemas']['MobileTokensDto'];
export type MobileLoginRequest = components['schemas']['MobileLoginRequest'];
export type MobileRegisterRequest = components['schemas']['MobileRegisterRequest'];
export type Me = components['schemas']['MeDto'];
export type UserProfile = Me;

export async function loginApi(data: MobileLoginRequest): Promise<MobileTokens> {
  const response = await client.post('/auth/mobile/login', data);
  return unwrap<MobileTokens>(response.data);
}

export async function registerApi(data: MobileRegisterRequest): Promise<MobileTokens> {
  const response = await client.post('/auth/mobile/register', data);
  return unwrap<MobileTokens>(response.data);
}

export async function refreshApi(refreshToken: string): Promise<MobileTokens> {
  const response = await axios.post(
    `${ENV.API_BASE_URL}/auth/mobile/refresh`,
    { refreshToken },
    { timeout: 15000 }
  );
  return unwrap<MobileTokens>(response.data);
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

export async function getMeApi(): Promise<Me> {
  const response = await client.get('/me');
  return unwrap<Me>(response.data);
}

export async function forgotPasswordApi(email: string): Promise<void> {
  await client.post('/auth/password/forgot', { email });
}

export async function resendVerificationApi(): Promise<void> {
  await client.post('/auth/email-verification/resend');
}
