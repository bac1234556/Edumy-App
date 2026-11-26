// src/config/env.ts
// Strict environment validation for Edumy Mobile.

import { Platform } from 'react-native';

function getRequiredEnv(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `[ConfigError] Missing required environment variable: ${key}. Please check your .env file.`
    );
  }
  return value.trim().replace(/\/+$/, '');
}

const rawApiBaseUrl = getRequiredEnv(
  'EXPO_PUBLIC_API_BASE_URL',
  process.env.EXPO_PUBLIC_API_BASE_URL
);

const rawWebBaseUrl = getRequiredEnv(
  'EXPO_PUBLIC_WEB_BASE_URL',
  process.env.EXPO_PUBLIC_WEB_BASE_URL
);
const webBaseUrl =
  rawWebBaseUrl.includes('localhost:3000') || rawWebBaseUrl.includes('127.0.0.1:3000')
    ? 'https://edumy.id.vn'
    : rawWebBaseUrl;

if (
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  process.env.NODE_ENV !== 'test' &&
  Platform.OS !== 'web' &&
  (webBaseUrl.includes('localhost') || webBaseUrl.includes('127.0.0.1'))
) {
  console.warn(
    `[ConfigWarning] EXPO_PUBLIC_WEB_BASE_URL đang đặt là "${webBaseUrl}". Trên thiết bị thật hoặc Android Emulator, localhost trỏ vào chính thiết bị đó — hãy đổi sang IP LAN của máy tính (ví dụ: http://192.168.1.x:3000).`
  );
}

function getOptionalEnv(value: string | undefined): string | undefined {
  if (!value || value.trim() === '') return undefined;
  return value.trim();
}

export const ENV = {
  API_BASE_URL:
    Platform.OS === 'web'
      ? rawApiBaseUrl
          .replace('://10.0.2.2:', '://192.168.60.165:')
          .replace('://localhost:', '://192.168.60.165:')
      : rawApiBaseUrl.replace('://10.0.2.2:', '://192.168.60.165:'),
  WEB_BASE_URL: webBaseUrl,
  ADMOB_BANNER_ID: getOptionalEnv(process.env.EXPO_PUBLIC_ADMOB_BANNER_ID),
  ADMOB_INTERSTITIAL_ID: getOptionalEnv(process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID),
} as const;
