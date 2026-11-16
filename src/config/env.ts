// src/config/env.ts
// Strict environment validation for Edumy Mobile.

function getRequiredEnv(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `[ConfigError] Missing required environment variable: ${key}. Please check your .env file.`
    );
  }
  return value.trim().replace(/\/+$/, ''); // Remove trailing slash
}

export const ENV = {
  API_BASE_URL: getRequiredEnv(
    'EXPO_PUBLIC_API_BASE_URL',
    process.env.EXPO_PUBLIC_API_BASE_URL
  ),
  WEB_BASE_URL: getRequiredEnv(
    'EXPO_PUBLIC_WEB_BASE_URL',
    process.env.EXPO_PUBLIC_WEB_BASE_URL
  ),
} as const;
