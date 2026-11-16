// src/config/env.ts
// Strict environment validation for Edumy Mobile.

import { Platform } from 'react-native';

function getRequiredEnv(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `[ConfigError] Missing required environment variable: ${key}. Please check your .env file.`
    );
  }
  return value.trim().replace(/\/+$/, ''); // Remove trailing slash
}

const rawApiBaseUrl = getRequiredEnv(
  'EXPO_PUBLIC_API_BASE_URL',
  process.env.EXPO_PUBLIC_API_BASE_URL
);

export const ENV = {
  API_BASE_URL:
    Platform.OS === 'web'
      ? rawApiBaseUrl.replace('://10.0.2.2:', '://localhost:')
      : rawApiBaseUrl,
  WEB_BASE_URL: getRequiredEnv(
    'EXPO_PUBLIC_WEB_BASE_URL',
    process.env.EXPO_PUBLIC_WEB_BASE_URL
  ),
} as const;
