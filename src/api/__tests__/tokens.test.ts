// src/api/__tests__/tokens.test.ts
import { getRefreshToken, setRefreshToken, removeRefreshToken } from '../tokens';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('tokens.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads refresh token from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('my-refresh-token');
    const token = await getRefreshToken();
    expect(token).toBe('my-refresh-token');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('edumy.refreshToken');
  });

  it('saves refresh token to SecureStore', async () => {
    await setRefreshToken('new-refresh-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('edumy.refreshToken', 'new-refresh-token');
  });

  it('removes refresh token from SecureStore', async () => {
    await removeRefreshToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('edumy.refreshToken');
  });

  it('returns null safely when SecureStore throws an error', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage unavailable'));
    const token = await getRefreshToken();
    expect(token).toBeNull();
  });
});
