import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080/api').replace(/\/$/, '');
export const authClient = axios.create({ baseURL, timeout: 15000 });
export const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().session?.accessToken;
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing;
async function refreshSession() {
  const snapshot = useAuthStore.getState().session;
  if (!snapshot) throw new Error('Vui lòng đăng nhập lại');
  try {
    const { data } = await authClient.post('/auth/refresh', { refreshToken: snapshot.refreshToken });
    if (useAuthStore.getState().session?.refreshToken !== snapshot.refreshToken) {
      throw new Error('Phiên đăng nhập đã thay đổi');
    }
    await useAuthStore.getState().setSession(data.data);
    if (useAuthStore.getState().session?.accessToken !== data.data.accessToken) {
      throw new Error('Phiên đăng nhập đã thay đổi');
    }
    return data.data.accessToken;
  } catch (error) {
    // A temporary network error should not erase a valid refresh token.
    if ([400, 401, 403].includes(error.response?.status)
        && useAuthStore.getState().session?.refreshToken === snapshot.refreshToken) {
      await useAuthStore.getState().clearSession();
    }
    throw error;
  }
}

api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && original?._retry
      && original.headers.Authorization === `Bearer ${useAuthStore.getState().session?.accessToken}`) {
    await useAuthStore.getState().clearSession();
  }
  if (error.response?.status !== 401 || !original || original._retry
      || !useAuthStore.getState().session?.refreshToken) throw error;
  original._retry = true;
  if (!refreshing) refreshing = refreshSession().finally(() => { refreshing = null; });
  const token = await refreshing;
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
});

export function errorMessage(error) {
  return error.response?.data?.message || (error.response
    ? 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.'
    : 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.');
}
