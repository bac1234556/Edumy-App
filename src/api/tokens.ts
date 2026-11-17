// src/api/tokens.ts
// Platform-aware refresh token storage:
// - Native (Android/iOS): expo-secure-store (Keychain / Keystore)
// - Web: in-memory only (no localStorage; reload requires re-login)

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'edumy.refreshToken';

let webMemoryRefreshToken: string | null = null;

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webMemoryRefreshToken;
  }
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryRefreshToken = token;
    return;
  }
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('[SecureStore] Failed to save refresh token:', error);
  }
}

export async function removeRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryRefreshToken = null;
    return;
  }
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('[SecureStore] Failed to delete refresh token:', error);
  }
}
