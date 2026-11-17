// src/features/auth/__tests__/hooks.test.ts
import { QueryClient } from '@tanstack/react-query';
import { performLogout, restoreSessionSequence } from '../hooks';
import * as authApi from '../api';
import * as tokens from '../../../api/tokens';
import { useSessionStore } from '../../../store/session';
import { AxiosError, AxiosResponse } from 'axios';

jest.mock('../../../api/tokens', () => ({
  getRefreshToken: jest.fn(),
  setRefreshToken: jest.fn(),
  removeRefreshToken: jest.fn(),
}));

jest.mock('../api', () => ({
  loginApi: jest.fn(),
  registerApi: jest.fn(),
  logoutApi: jest.fn(),
  refreshApi: jest.fn(),
  getMeApi: jest.fn(),
  forgotPasswordApi: jest.fn(),
  resendVerificationApi: jest.fn(),
}));

describe('restoreSessionSequence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({
      status: 'idle',
      sessionEpoch: 0,
      accessToken: null,
      me: null,
    });
  });

  it('preserves refresh token and sets offline status on network error', async () => {
    (tokens.getRefreshToken as jest.Mock).mockResolvedValue('saved-refresh');
    (authApi.refreshApi as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      message: 'Network Error',
    } as AxiosError);

    await restoreSessionSequence();

    expect(tokens.removeRefreshToken).not.toHaveBeenCalled();
    expect(useSessionStore.getState().status).toBe('offline');
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it('removes refresh token on 401 AUTH_REFRESH_REUSED', async () => {
    (tokens.getRefreshToken as jest.Mock).mockResolvedValue('reused-refresh');
    (authApi.refreshApi as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        headers: {},
        data: {
          success: false,
          message: 'Refresh token đã được sử dụng lại.',
          data: null,
          errors: {
            code: 'AUTH_REFRESH_REUSED',
            fields: null,
            traceId: 't-reuse',
          },
        },
      } as unknown as AxiosResponse,
    } as AxiosError);

    await restoreSessionSequence();

    expect(tokens.removeRefreshToken).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().status).toBe('unauthenticated');
  });

  it('restores session in order: refresh -> save token -> getMe -> setSession', async () => {
    const order: string[] = [];
    (tokens.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh');
    (authApi.refreshApi as jest.Mock).mockImplementation(async () => {
      order.push('refresh');
      return { accessToken: 'new-access', refreshToken: 'new-refresh' };
    });
    (tokens.setRefreshToken as jest.Mock).mockImplementation(async () => {
      order.push('saveToken');
    });
    (authApi.getMeApi as jest.Mock).mockImplementation(async (token) => {
      expect(token).toBe('new-access');
      order.push('getMe');
      return { id: 7, email: 'student@edumy.com', fullName: 'Học Viên', emailVerified: true, roles: ['STUDENT'] };
    });

    await restoreSessionSequence();

    expect(order).toEqual(['refresh', 'saveToken', 'getMe']);
    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().accessToken).toBe('new-access');
    expect(useSessionStore.getState().me?.id).toBe(7);
  });
});

describe('performLogout', () => {
  it('clears session, cancels & clears query cache, removes token, calls logoutApi and replaces route', async () => {
    const order: string[] = [];
    useSessionStore.setState({
      status: 'authenticated',
      sessionEpoch: 2,
      accessToken: 'active-token',
      me: { id: 1, roles: ['STUDENT'] },
    });

    const queryClient = new QueryClient();
    const cancelSpy = jest.spyOn(queryClient, 'cancelQueries').mockImplementation(async () => {
      order.push('cancelQueries');
    });
    const clearSpy = jest.spyOn(queryClient, 'clear').mockImplementation(() => {
      order.push('clearCache');
    });

    (tokens.getRefreshToken as jest.Mock).mockImplementation(async () => {
      order.push('getRefreshToken');
      return 'refresh-abc';
    });
    (tokens.removeRefreshToken as jest.Mock).mockImplementation(async () => {
      order.push('removeRefreshToken');
    });
    (authApi.logoutApi as jest.Mock).mockImplementation(async () => {
      order.push('logoutApi');
    });
    const replaceRoute = jest.fn(() => {
      order.push('replaceRoute');
    });

    await performLogout(queryClient, replaceRoute);

    expect(useSessionStore.getState().sessionEpoch).toBe(3);
    expect(useSessionStore.getState().status).toBe('unauthenticated');
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(replaceRoute).toHaveBeenCalledWith('/(auth)/login');
    expect(order).toEqual([
      'getRefreshToken',
      'cancelQueries',
      'clearCache',
      'removeRefreshToken',
      'logoutApi',
      'replaceRoute',
    ]);
  });
});
