// src/api/__tests__/tokens.test.ts
import { Platform } from 'react-native';
import { getRefreshToken, setRefreshToken, removeRefreshToken } from '../tokens';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('tokens.ts', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });

  it('reads refresh token from SecureStore on native', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('my-refresh-token');
    const token = await getRefreshToken();
    expect(token).toBe('my-refresh-token');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('edumy.refreshToken');
  });

  it('saves refresh token to SecureStore on native', async () => {
    await setRefreshToken('new-refresh-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('edumy.refreshToken', 'new-refresh-token');
  });

  it('removes refresh token from SecureStore on native', async () => {
    await removeRefreshToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('edumy.refreshToken');
  });

  it('returns null safely when SecureStore throws an error on native', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage unavailable'));
    const token = await getRefreshToken();
    expect(token).toBeNull();
  });

  it('stores refresh token in memory only on web without touching SecureStore', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    await setRefreshToken('web-mem-token');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(await getRefreshToken()).toBe('web-mem-token');

    await removeRefreshToken();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(await getRefreshToken()).toBeNull();
  });
});
