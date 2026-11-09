import MockAdapter from 'axios-mock-adapter';
import { api, authClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn().mockResolvedValue(), deleteItemAsync: jest.fn().mockResolvedValue(),
}));

const apiMock = new MockAdapter(api);
const authMock = new MockAdapter(authClient);
const session = { accessToken: 'old-access', refreshToken: 'old-refresh', user: { id: 1, role: 'STUDENT' } };

beforeEach(() => {
  apiMock.reset(); authMock.reset();
  useAuthStore.setState({ session, hydrated: true });
});
afterAll(() => { apiMock.restore(); authMock.restore(); });

test('concurrent 401 requests rotate once, persist and retry with the new token', async () => {
  apiMock.onGet('/users/me').reply((config) => config.headers.Authorization === 'Bearer new-access'
    ? [200, { data: session.user }] : [401, {}]);
  authMock.onPost('/auth/refresh-token').reply(200, {
    data: { ...session, accessToken: 'new-access', refreshToken: 'new-refresh' },
  });
  const replies = await Promise.all([api.get('/users/me'), api.get('/users/me')]);
  expect(replies.map((r) => r.status)).toEqual([200, 200]);
  expect(authMock.history.post).toHaveLength(1);
  expect(useAuthStore.getState().session.refreshToken).toBe('new-refresh');
});

test('an invalid refresh token clears the session', async () => {
  apiMock.onGet('/users/me').reply(401);
  authMock.onPost('/auth/refresh-token').reply(401, { message: 'Refresh token đã hết hạn' });
  await expect(api.get('/users/me')).rejects.toThrow();
  expect(useAuthStore.getState().session).toBeNull();
});

test('temporary network failure keeps the stored session for a later retry', async () => {
  apiMock.onGet('/users/me').reply(401);
  authMock.onPost('/auth/refresh-token').networkError();
  await expect(api.get('/users/me')).rejects.toThrow();
  expect(useAuthStore.getState().session).toEqual(session);
});

test('does not loop if a retried access request still returns 401', async () => {
  apiMock.onGet('/users/me').reply(401);
  authMock.onPost('/auth/refresh-token').reply(200, {
    data: { ...session, accessToken: 'new-access', refreshToken: 'new-refresh' },
  });
  await expect(api.get('/users/me')).rejects.toThrow();
  expect(apiMock.history.get).toHaveLength(2);
  expect(authMock.history.post).toHaveLength(1);
});
