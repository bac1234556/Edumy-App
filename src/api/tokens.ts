// src/api/tokens.ts
// Secure storage for refresh tokens (Key name: edumy.refreshToken)

import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'edumy.refreshToken';

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // If SecureStore is unavailable or fails, return null safely
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('[SecureStore] Failed to save refresh token:', error);
  }
}

export async function removeRefreshToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('[SecureStore] Failed to delete refresh token:', error);
  }
}
