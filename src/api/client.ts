// src/api/client.ts
// Centralized Axios client with Bearer auth, single-flight token refresh & RFC 9457 error parsing.

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../config/env';
import { useSessionStore } from '../store/session';
import { getRefreshToken, setRefreshToken, removeRefreshToken } from './tokens';
import { parseAppError } from './problem';
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

// Response Interceptor: Handle 401 with single-flight refresh
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedRequestConfig | undefined;

    if (!originalRequest || !error.response) {
      return Promise.reject(parseAppError(error));
    }

    const is401 = error.response.status === 401;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/mobile/');

    if (is401 && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const currentRefreshToken = await getRefreshToken();
            if (!currentRefreshToken) {
              throw new Error('NO_REFRESH_TOKEN');
            }

            // Call /auth/mobile/refresh directly using a clean axios instance to avoid recursive interceptors
            const response = await axios.post(
              `${ENV.API_BASE_URL}/auth/mobile/refresh`,
              { refreshToken: currentRefreshToken },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
              }
            );

            const data = unwrap<MobileTokensDto>(response.data);
            const newAccessToken = data?.accessToken;
            const newRefreshToken = data?.refreshToken;

            if (!newAccessToken || !newRefreshToken) {
              throw new Error('INVALID_TOKEN_RESPONSE');
            }

            // Save rotated refresh token in secure storage
            await setRefreshToken(newRefreshToken);

            // Update in-memory access token
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
        const axiosErr = refreshErr as AxiosError;
        const status = axiosErr.response?.status;

        // If refresh fails with 400 or 401 (token expired/revoked/reuse detected), clear session
        if (status === 400 || status === 401 || (refreshErr as Error).message === 'NO_REFRESH_TOKEN') {
          await removeRefreshToken();
          useSessionStore.getState().clearSession();
        }

        // On network failure during refresh, do NOT clear tokens (allow offline/retry)
        return Promise.reject(parseAppError(refreshErr));
      }
    }

    return Promise.reject(parseAppError(error));
  }
);
