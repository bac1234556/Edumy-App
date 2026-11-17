// src/features/auth/hooks.ts
// React Query hooks for login, register, session restore and logout.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useEffect, useState } from 'react';

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
      useSessionStore.getState().setAccessToken(tokens.accessToken);
      const profile = await getMeApi();
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
      useSessionStore.getState().setAccessToken(tokens.accessToken);
      const profile = await getMeApi();
      setSession(tokens.accessToken, profile);
      queryClient.setQueryData(queryKeys.auth.me, profile);
      return { tokens, profile };
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { clearSession } = useSessionStore();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await getRefreshToken();
      await logoutApi(refreshToken);
    },
    onSettled: async () => {
      await removeRefreshToken();
      clearSession();
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPasswordApi(email),
  });
}

/**
 * Hook to restore user session on app launch (flow 1 of rules 30).
 */
export function useRestoreSession() {
  const [isRestored, setIsRestored] = useState(false);
  const { setSession, clearSession } = useSessionStore();

  useEffect(() => {
    let isMounted = true;

    async function restore() {
      try {
        const storedRefreshToken = await getRefreshToken();
        if (!storedRefreshToken) {
          if (isMounted) {
            clearSession();
            setIsRestored(true);
          }
          return;
        }

        // Attempt token refresh
        const tokens = await refreshApi(storedRefreshToken);
        if (!tokens.accessToken || !tokens.refreshToken) {
          throw new Error('INVALID_TOKEN_RESPONSE');
        }
        await setRefreshToken(tokens.refreshToken);
        useSessionStore.getState().setAccessToken(tokens.accessToken);

        // Fetch user profile
        const profile = await getMeApi();
        if (isMounted) {
          setSession(tokens.accessToken, profile);
          setIsRestored(true);
        }
      } catch {
        if (isMounted) {
          await removeRefreshToken();
          clearSession();
          setIsRestored(true);
        }
      }
    }

    restore();

    return () => {
      isMounted = false;
    };
  }, [setSession, clearSession]);

  return { isRestored };
}
