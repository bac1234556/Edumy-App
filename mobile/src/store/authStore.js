import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY = 'edumy.auth.session';
export const roleHome = (role) => ({
  STUDENT: '/(student)', INSTRUCTOR: '/(instructor)', ADMIN: '/(admin)',
})[role] || '/(auth)';

const valid = (session) => session && typeof session.accessToken === 'string' && session.accessToken.length > 0
  && typeof session.refreshToken === 'string' && session.refreshToken.length > 0
  && ['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(session.user?.role);

let revision = 0;
let storageWork = Promise.resolve();
function enqueueStorage(work) {
  storageWork = storageWork.catch(() => {}).then(work);
  return storageWork;
}

export const useAuthStore = create((set) => ({
  session: null,
  hydrated: false,
  storageError: null,
  hydrate: async () => {
    const currentRevision = revision;
    try {
      const stored = await enqueueStorage(() => SecureStore.getItemAsync(KEY));
      if (revision !== currentRevision) return;
      const session = stored ? JSON.parse(stored) : null;
      if (session && !valid(session)) throw new Error('Phiên đăng nhập không hợp lệ');
      set({ session, hydrated: true, storageError: null });
    } catch {
      if (revision !== currentRevision) return;
      await enqueueStorage(() => SecureStore.deleteItemAsync(KEY)).catch(() => {});
      if (revision !== currentRevision) return;
      set({ session: null, hydrated: true, storageError: 'Không thể khôi phục phiên. Vui lòng đăng nhập lại.' });
    }
  },
  setSession: async (session) => {
    if (!valid(session)) throw new Error('Phản hồi đăng nhập không hợp lệ');
    const currentRevision = ++revision;
    await enqueueStorage(() => SecureStore.setItemAsync(KEY, JSON.stringify(session)));
    if (revision === currentRevision) set({ session, storageError: null });
  },
  clearSession: async () => {
    ++revision;
    set({ session: null });
    try {
      await enqueueStorage(() => SecureStore.deleteItemAsync(KEY));
      set({ storageError: null });
    } catch {
      set({ storageError: 'Không thể xóa phiên trên thiết bị. Vui lòng thử lại.' });
    }
  },
}));
