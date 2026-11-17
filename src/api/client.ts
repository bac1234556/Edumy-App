// src/api/client.ts
// Centralized Axios client with Bearer auth, single-flight epoch-guarded token refresh & v2 error parsing.

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../config/env';
import { emitSessionExpired, useSessionStore } from '../store/session';
import { getRefreshToken, setRefreshToken, removeRefreshToken } from './tokens';
import { AppError, parseAppError } from './problem';
import { unwrap } from './envelope';
import { components } from './schema';

type MobileTokensDto = components['schemas']['MobileTokensDto'];

export const client = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

interface ExtendedRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// In-flight refresh promise for single-flight token rotation
let refreshPromise: Promise<string> | null = null;

// Request Interceptor: Attach Bearer token from Zustand memory store
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useSessionStore.getState().accessToken;
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(parseAppError(error))
);

// Response Interceptor: Handle 401 with single-flight epoch-guarded refresh
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedRequestConfig | undefined;

    if (!originalRequest || !error.response) {
      return Promise.reject(parseAppError(error));
    }

    const is401 = error.response.status === 401;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/mobile/');

    // Never refresh for 403 or /auth/mobile/* endpoints
    if (is401 && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          const epochAtStart = useSessionStore.getState().sessionEpoch;

          refreshPromise = (async () => {
            const currentRefreshToken = await getRefreshToken();
            if (!currentRefreshToken) {
              throw new Error('NO_REFRESH_TOKEN');
            }

            // Call /auth/mobile/refresh directly using clean axios to avoid recursive interceptors
            const response = await axios.post(
              `${ENV.API_BASE_URL}/auth/mobile/refresh`,
              { refreshToken: currentRefreshToken },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
              }
            );

            // Epoch guard: if user logged out while refresh was in flight, discard rotated tokens
            if (useSessionStore.getState().sessionEpoch !== epochAtStart) {
              const endedErr: AppError = {
                kind: 'problem',
                status: 401,
                code: 'SESSION_ENDED',
                message: 'Phiên đăng nhập đã kết thúc.',
              };
              throw endedErr;
            }

            const data = unwrap<MobileTokensDto>(response.data);
            const newAccessToken = data?.accessToken;
            const newRefreshToken = data?.refreshToken;

            if (!newAccessToken || !newRefreshToken) {
              throw new Error('INVALID_TOKEN_RESPONSE');
            }

            // Re-check epoch right before saving tokens
            if (useSessionStore.getState().sessionEpoch !== epochAtStart) {
              const endedErr: AppError = {
                kind: 'problem',
                status: 401,
                code: 'SESSION_ENDED',
                message: 'Phiên đăng nhập đã kết thúc.',
              };
              throw endedErr;
            }

            await setRefreshToken(newRefreshToken);
            useSessionStore.getState().setAccessToken(newAccessToken);

            return newAccessToken;
          })().finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshErr) {
        const parsedRefreshErr = parseAppError(refreshErr);

        if (parsedRefreshErr.code === 'SESSION_ENDED') {
          return Promise.reject(parsedRefreshErr);
        }

        const status = parsedRefreshErr.status;
        const errMsg = refreshErr instanceof Error ? refreshErr.message : '';

        // If refresh fails with 401 or 403 (token expired/revoked/reused/account locked), clear session & notify
        if (
          status === 401 ||
          status === 403 ||
          errMsg === 'NO_REFRESH_TOKEN' ||
          errMsg === 'INVALID_TOKEN_RESPONSE'
        ) {
          await removeRefreshToken();
          useSessionStore.getState().clearSession();
          emitSessionExpired();
        }

        // On network/timeout failure during refresh, preserve refresh token
        return Promise.reject(parsedRefreshErr);
      }
    }

    return Promise.reject(parseAppError(error));
  }
);
