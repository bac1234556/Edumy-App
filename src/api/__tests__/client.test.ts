// src/api/__tests__/client.test.ts
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { client } from '../client';
import { useSessionStore } from '../../store/session';
import * as tokens from '../tokens';

jest.mock('../tokens', () => ({
  getRefreshToken: jest.fn(),
  setRefreshToken: jest.fn(),
  removeRefreshToken: jest.fn(),
}));

describe('Axios Client & Single-flight 401 Token Refresh', () => {
  let mockClient: MockAdapter;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new MockAdapter(client);
    mockAxios = new MockAdapter(axios);
    useSessionStore.setState({ accessToken: 'old-access-token', me: null, status: 'authenticated' });
  });

  afterEach(() => {
    mockClient.restore();
    mockAxios.restore();
  });

  it('attaches Bearer token from session store on requests', async () => {
    mockClient.onGet('/test-auth').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer old-access-token');
      return [200, { success: true }];
    });

    const res = await client.get('/test-auth');
    expect(res.data).toEqual({ success: true });
  });

  it('handles 5 parallel 401 requests with exactly 1 refresh call and retries all 5', async () => {
    let refreshCalls = 0;
    (tokens.getRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');

    // Mock the direct refresh endpoint
    mockAxios.onPost('http://10.0.2.2:5000/api/v1/auth/mobile/refresh').reply(() => {
      refreshCalls++;
      return [
        200,
        {
          accessToken: 'brand-new-access-token',
          refreshToken: 'brand-new-refresh-token',
          expiresAt: '2026-11-24T00:00:00Z',
          refreshExpiresAt: '2026-11-24T00:00:00Z',
        },
      ];
    });

    // Mock 5 parallel requests that initially fail with 401, then succeed with new token
    let callCounts: Record<string, number> = {
      '/course/1': 0,
      '/course/2': 0,
      '/course/3': 0,
      '/course/4': 0,
      '/course/5': 0,
    };

    for (let i = 1; i <= 5; i++) {
      const url = `/course/${i}`;
      mockClient.onGet(url).reply((config) => {
        callCounts[url]++;
        if (config.headers?.Authorization === 'Bearer brand-new-access-token') {
          return [200, { courseId: i, title: `Course ${i}` }];
        }
        return [401, { detail: 'Token expired' }];
      });
    }

    // Fire 5 requests in parallel
    const results = await Promise.all([
      client.get('/course/1'),
      client.get('/course/2'),
      client.get('/course/3'),
      client.get('/course/4'),
      client.get('/course/5'),
    ]);

    // Exactly 1 refresh call was made for all 5 parallel 401s
    expect(refreshCalls).toBe(1);

    // All 5 requests retried and succeeded
    for (let i = 0; i < 5; i++) {
      expect(results[i].data).toEqual({ courseId: i + 1, title: `Course ${i + 1}` });
    }

    // Saved rotated refresh token
    expect(tokens.setRefreshToken).toHaveBeenCalledWith('brand-new-refresh-token');
    // Updated in-memory store
    expect(useSessionStore.getState().accessToken).toBe('brand-new-access-token');
  });

  it('refresh returning 401 clears secure token and session', async () => {
    (tokens.getRefreshToken as jest.Mock).mockResolvedValue('revoked-refresh-token');

    mockAxios.onPost('http://10.0.2.2:5000/api/v1/auth/mobile/refresh').reply(401, {
      detail: 'Session revoked or expired',
    });

    mockClient.onGet('/protected-data').reply(401, { detail: 'Unauthorized' });

    await expect(client.get('/protected-data')).rejects.toMatchObject({
      kind: 'problem',
      status: 401,
    });

    expect(tokens.removeRefreshToken).toHaveBeenCalled();
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(useSessionStore.getState().status).toBe('unauthenticated');
  });

  it('network error during refresh preserves token in secure storage', async () => {
    (tokens.getRefreshToken as jest.Mock).mockResolvedValue('stored-refresh-token');

    mockAxios.onPost('http://10.0.2.2:5000/api/v1/auth/mobile/refresh').networkError();
    mockClient.onGet('/data').reply(401);

    await expect(client.get('/data')).rejects.toMatchObject({
      kind: 'network',
    });

    // Do NOT remove refresh token on network failure
    expect(tokens.removeRefreshToken).not.toHaveBeenCalled();
  });
});
