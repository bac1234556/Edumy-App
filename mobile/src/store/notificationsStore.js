import { create } from 'zustand';

export const useNotificationsStore = create((set) => ({
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount: Math.max(0, Number(unreadCount) || 0) }),
}));
