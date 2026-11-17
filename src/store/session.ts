// src/store/session.ts
// In-memory authentication and session state (Zustand) with epoch guard & expiry events.

import { create } from 'zustand';
import { components } from '../api/schema';

export type UserProfile = components['schemas']['MeDto'];

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'offline';

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function subscribeSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function emitSessionExpired(): void {
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  });
}

interface SessionState {
  status: AuthStatus;
  sessionEpoch: number;
  accessToken: string | null;
  me: UserProfile | null;
  setSession: (accessToken: string, me: UserProfile) => void;
  setAccessToken: (accessToken: string | null) => void;
  setProfile: (me: UserProfile | null) => void;
  setOffline: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'idle',
  sessionEpoch: 0,
  accessToken: null,
  me: null,
  setSession: (accessToken, me) =>
    set({ accessToken, me, status: 'authenticated' }),
  setAccessToken: (accessToken) =>
    set(() => ({
      accessToken,
      status: accessToken ? 'authenticated' : 'unauthenticated',
    })),
  setProfile: (me) => set({ me }),
  setOffline: () =>
    set({
      accessToken: null,
      me: null,
      status: 'offline',
    }),
  clearSession: () =>
    set((state) => ({
      sessionEpoch: state.sessionEpoch + 1,
      accessToken: null,
      me: null,
      status: 'unauthenticated',
    })),
}));
