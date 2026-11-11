import { create } from 'zustand';

export const useNetworkNoticeStore = create((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  dismiss: () => set({ visible: false }),
}));
