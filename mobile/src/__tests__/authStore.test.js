import * as SecureStore from 'expo-secure-store';
import { roleHome, useAuthStore } from '../store/authStore';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));

const session = { accessToken: 'access', refreshToken: 'refresh', user: { id: 1, role: 'STUDENT' } };

beforeEach(() => {
  useAuthStore.setState({ session: null, hydrated: false, storageError: null });
  SecureStore.getItemAsync.mockResolvedValue(null);
  SecureStore.setItemAsync.mockResolvedValue(undefined);
  SecureStore.deleteItemAsync.mockResolvedValue(undefined);
});

test('hydrates an empty store without authenticating', async () => {
  await useAuthStore.getState().hydrate();
  expect(useAuthStore.getState()).toMatchObject({ hydrated: true, session: null });
});

test('persists tokens in SecureStore and restores the role', async () => {
  await useAuthStore.getState().setSession(session);
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('edumy.auth.session', JSON.stringify(session));
  useAuthStore.setState({ session: null });
  SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(session));
  await useAuthStore.getState().hydrate();
  expect(useAuthStore.getState().session).toEqual(session);
  expect(roleHome(session.user.role)).toBe('/(student)');
  expect(roleHome('INSTRUCTOR')).toBe('/(instructor)');
  expect(roleHome('ADMIN')).toBe('/(admin)');
});

test.each(['{bad json', JSON.stringify({ ...session, user: { role: 'UNKNOWN' } })])(
  'invalid saved sessions are removed and reported', async (stored) => {
    SecureStore.getItemAsync.mockResolvedValue(stored);
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().storageError).toBeTruthy();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  },
);

test('a storage write failure does not authenticate the user', async () => {
  SecureStore.setItemAsync.mockRejectedValue(new Error('storage unavailable'));
  await expect(useAuthStore.getState().setSession(session)).rejects.toThrow();
  expect(useAuthStore.getState().session).toBeNull();
});

test('logout deletes persisted tokens', async () => {
  await useAuthStore.getState().setSession(session);
  await useAuthStore.getState().clearSession();
  expect(useAuthStore.getState().session).toBeNull();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('edumy.auth.session');
});

test('logout during a secure write cannot resurrect the old session', async () => {
  let finishWrite;
  SecureStore.setItemAsync.mockImplementation(() => new Promise((resolve) => { finishWrite = resolve; }));
  const saving = useAuthStore.getState().setSession(session);
  await new Promise(setImmediate);
  const clearing = useAuthStore.getState().clearSession();
  finishWrite();
  await Promise.all([saving, clearing]);
  expect(useAuthStore.getState().session).toBeNull();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('edumy.auth.session');
});
