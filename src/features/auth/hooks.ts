// src/features/auth/hooks.ts
// React Query hooks for login, register, session restore and logout.

import { useCallback, useEffect, useState } from 'react';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  loginApi,
  registerApi,
  logoutApi,
  refreshApi,
  getMeApi,
  forgotPasswordApi,
  MobileLoginRequest,
  MobileRegisterRequest,
} from './api';
import { useSessionStore } from '../../store/session';
import { getRefreshToken, setRefreshToken, removeRefreshToken } from '../../api/tokens';
import { queryKeys } from '../../api/query-keys';
import { parseAppError } from '../../api/problem';

function isTerminalRestoreError(err: unknown): boolean {
  const appErr = parseAppError(err);
  if (
    appErr.status === 401 &&
    (appErr.code === 'AUTH_REFRESH_INVALID' || appErr.code === 'AUTH_REFRESH_REUSED')
  ) {
    return true;
  }
  if (appErr.status === 403 && appErr.code === 'AUTH_ACCOUNT_LOCKED') {
    return true;
  }
  if (err instanceof Error && err.message === 'INVALID_TOKEN_RESPONSE') {
    return true;
  }
  return false;
}

/**
 * Executes session restore sequence:
 * 1. Read refresh token
 * 2. Refresh -> persist new refresh token -> fetch /me -> setSession
 * 3. Only clear refresh token on terminal auth codes (401 AUTH_REFRESH_INVALID/REUSED, 403 AUTH_ACCOUNT_LOCKED)
 * 4. Preserve refresh token and mark 'offline' on network/timeout/server-down errors
 */
export async function restoreSessionSequence(): Promise<void> {
  const { setSession, clearSession, setOffline } = useSessionStore.getState();

  const storedRefreshToken = await getRefreshToken();
  if (!storedRefreshToken) {
    clearSession();
    return;
  }

  try {
    const tokens = await refreshApi(storedRefreshToken);
    if (!tokens.accessToken || !tokens.refreshToken) {
      throw new Error('INVALID_TOKEN_RESPONSE');
    }

    await setRefreshToken(tokens.refreshToken);
    const profile = await getMeApi(tokens.accessToken);
    setSession(tokens.accessToken, profile);
  } catch (err) {
    if (isTerminalRestoreError(err)) {
      await removeRefreshToken();
      clearSession();
    } else {
      setOffline();
    }
  }
}

/**
 * Executes full logout in strict order to prevent in-flight refresh race conditions:
 * 1. Read refresh token
 * 2. clearSession() immediately (increments sessionEpoch)
 * 3. cancelQueries()
 * 4. clear() QueryClient cache
 * 5. Remove refresh token from SecureStore / memory
 * 6. Best-effort POST /auth/mobile/logout (timeout, errors ignored)
 * 7. Navigate to /(auth)/login
 */
export async function performLogout(
  queryClient: QueryClient,
  replaceRoute: (href: '/(auth)/login') => void
): Promise<void> {
  const refreshToken = await getRefreshToken();
  useSessionStore.getState().clearSession();
  await queryClient.cancelQueries();
  queryClient.clear();
  await removeRefreshToken();
  await logoutApi(refreshToken);
  replaceRoute('/(auth)/login');
}

export function useMe() {
  const { accessToken, me, setProfile } = useSessionStore();

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const profile = await getMeApi();
      setProfile(profile);
      return profile;
    },
    enabled: Boolean(accessToken),
    initialData: me || undefined,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setSession } = useSessionStore();

  return useMutation({
    mutationFn: async (data: MobileLoginRequest) => {
      const tokens = await loginApi(data);
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Phản hồi đăng nhập không hợp lệ.');
      }
      await setRefreshToken(tokens.refreshToken);
      const profile = await getMeApi(tokens.accessToken);
      setSession(tokens.accessToken, profile);
      queryClient.setQueryData(queryKeys.auth.me, profile);
      return { tokens, profile };
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const { setSession } = useSessionStore();

  return useMutation({
    mutationFn: async (data: MobileRegisterRequest) => {
      const tokens = await registerApi(data);
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Phản hồi đăng ký không hợp lệ.');
      }
      await setRefreshToken(tokens.refreshToken);
      const profile = await getMeApi(tokens.accessToken);
      setSession(tokens.accessToken, profile);
      queryClient.setQueryData(queryKeys.auth.me, profile);
      return { tokens, profile };
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => performLogout(queryClient, (href) => router.replace(href)),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPasswordApi(email),
  });
}

/**
 * Hook to restore user session on app launch and retry when offline.
 */
export function useRestoreSession() {
  const [isRestored, setIsRestored] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const retryRestore = useCallback(async () => {
    setIsRetrying(true);
    try {
      await restoreSessionSequence();
    } finally {
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      await restoreSessionSequence();
      if (isMounted) {
        setIsRestored(true);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isRestored, isRetrying, retryRestore };
}
