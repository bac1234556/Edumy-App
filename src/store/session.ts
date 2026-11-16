// src/store/session.ts
// In-memory authentication and session state (Zustand).

import { create } from 'zustand';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface SessionState {
  status: AuthStatus;
  accessToken: string | null;
  me: UserProfile | null;
  setSession: (accessToken: string, me: UserProfile) => void;
  setAccessToken: (accessToken: string | null) => void;
  setProfile: (me: UserProfile | null) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'idle',
  accessToken: null,
  me: null,
  setSession: (accessToken, me) =>
    set({ accessToken, me, status: 'authenticated' }),
  setAccessToken: (accessToken) =>
    set((state) => ({
      accessToken,
      status: accessToken ? 'authenticated' : 'unauthenticated',
    })),
  setProfile: (me) => set({ me }),
  clearSession: () =>
    set({
      accessToken: null,
      me: null,
      status: 'unauthenticated',
    }),
}));
