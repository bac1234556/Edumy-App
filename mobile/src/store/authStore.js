import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY = 'edumy.auth.session';
export const roleHome = (role) => ({
  STUDENT: '/(student)', INSTRUCTOR: '/(instructor)', ADMIN: '/(admin)',
})[role] || '/(auth)';

const valid = (session) => session && typeof session.accessToken === 'string'
  && typeof session.refreshToken === 'string' && ['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(session.user?.role);

export const useAuthStore = create((set) => ({
  session: null,
  hydrated: false,
  storageError: null,
  hydrate: async () => {
    try {
      const stored = await SecureStore.getItemAsync(KEY);
      const session = stored ? JSON.parse(stored) : null;
      if (session && !valid(session)) throw new Error('Phiên đăng nhập không hợp lệ');
      set({ session, hydrated: true, storageError: null });
    } catch {
      await SecureStore.deleteItemAsync(KEY).catch(() => {});
      set({ session: null, hydrated: true, storageError: 'Không thể khôi phục phiên. Vui lòng đăng nhập lại.' });
    }
  },
  setSession: async (session) => {
    if (!valid(session)) throw new Error('Phản hồi đăng nhập không hợp lệ');
    await SecureStore.setItemAsync(KEY, JSON.stringify(session));
    set({ session, storageError: null });
  },
  clearSession: async () => {
    set({ session: null });
    try {
      await SecureStore.deleteItemAsync(KEY);
      set({ storageError: null });
    } catch {
      set({ storageError: 'Không thể xóa phiên trên thiết bị. Vui lòng thử lại.' });
    }
  },
}));
