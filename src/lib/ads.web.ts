// src/lib/ads.web.ts
// Web no-op implementation for Google AdMob so `expo start --web` never imports native SDKs.

import { useCallback } from 'react';

export function isAdMobAvailable(): boolean {
  return false;
}

export function getAdMobModule(): null {
  return null;
}

export async function initializeAds(): Promise<void> {
  // No-op on web
}

export function getBannerAdUnitId(): string {
  return '';
}

export function getInterstitialAdUnitId(): string {
  return '';
}

export interface UseInterstitialAdResult {
  isLoaded: boolean;
  showIfReady: (onDone: () => void) => void;
}

export function useInterstitialAd(): UseInterstitialAdResult {
  const showIfReady = useCallback((onDone: () => void) => {
    onDone();
  }, []);

  return { isLoaded: false, showIfReady };
}
