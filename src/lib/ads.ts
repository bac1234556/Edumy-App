// src/lib/ads.ts
// Platform-safe Google AdMob adapter for native Android / iOS Development Builds.
// Degrades gracefully on Expo Go and Jest without crashing.

import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { ENV } from '../config/env';
import {
  DEFAULT_INTERSTITIAL_COOLDOWN_MS,
  shouldShowInterstitial,
} from '../features/ads/logic';

type AdMobModule = typeof import('react-native-google-mobile-ads');

let cachedModule: AdMobModule | null | undefined;
let initialized = false;
let lastInterstitialShownAt: number | null = null;

export function isAdMobAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return false;
  }
  const hasNativeModule =
    Boolean(NativeModules?.RNGoogleMobileAdsModule) ||
    Boolean(TurboModuleRegistry?.get?.('RNGoogleMobileAdsModule'));
  return hasNativeModule;
}

export function getAdMobModule(): AdMobModule | null {
  if (!isAdMobAvailable()) return null;
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('react-native-google-mobile-ads') as AdMobModule;
    return cachedModule;
  } catch {
    cachedModule = null;
    return null;
  }
}

export async function initializeAds(): Promise<void> {
  if (initialized) return;
  const mod = getAdMobModule();
  if (!mod) return;
  initialized = true;
  try {
    await mod.default().initialize();
  } catch {
    // Never block app startup if AdMob initialization fails
  }
}

export function getBannerAdUnitId(): string {
  const mod = getAdMobModule();
  if (!mod) return '';
  if (!__DEV__ && ENV.ADMOB_BANNER_ID) {
    return ENV.ADMOB_BANNER_ID;
  }
  return mod.TestIds.BANNER;
}

export function getInterstitialAdUnitId(): string {
  const mod = getAdMobModule();
  if (!mod) return '';
  if (!__DEV__ && ENV.ADMOB_INTERSTITIAL_ID) {
    return ENV.ADMOB_INTERSTITIAL_ID;
  }
  return mod.TestIds.INTERSTITIAL;
}

export interface UseInterstitialAdResult {
  isLoaded: boolean;
  showIfReady: (onDone: () => void) => void;
}

export function useInterstitialAd(options?: { cooldownMs?: number }): UseInterstitialAdResult {
  const cooldownMs = options?.cooldownMs ?? DEFAULT_INTERSTITIAL_COOLDOWN_MS;
  const [isLoaded, setIsLoaded] = useState(false);
  const interstitialRef = useRef<ReturnType<AdMobModule['InterstitialAd']['createForAdRequest']> | null>(
    null
  );
  const pendingCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const mod = getAdMobModule();
    if (!mod) return;

    const adUnitId = getInterstitialAdUnitId();
    if (!adUnitId) return;

    const interstitial = mod.InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitialRef.current = interstitial;

    const unsubLoaded = interstitial.addAdEventListener(mod.AdEventType.LOADED, () => {
      setIsLoaded(true);
    });

    const unsubClosed = interstitial.addAdEventListener(mod.AdEventType.CLOSED, () => {
      setIsLoaded(false);
      const cb = pendingCallbackRef.current;
      pendingCallbackRef.current = null;
      cb?.();
      interstitial.load();
    });

    const unsubError = interstitial.addAdEventListener(mod.AdEventType.ERROR, () => {
      setIsLoaded(false);
      const cb = pendingCallbackRef.current;
      pendingCallbackRef.current = null;
      cb?.();
    });

    interstitial.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
      interstitialRef.current = null;
      pendingCallbackRef.current = null;
    };
  }, []);

  const showIfReady = useCallback(
    (onDone: () => void) => {
      const interstitial = interstitialRef.current;
      const now = Date.now();
      if (
        !interstitial ||
        !isLoaded ||
        !shouldShowInterstitial(lastInterstitialShownAt, now, cooldownMs)
      ) {
        onDone();
        return;
      }

      lastInterstitialShownAt = now;
      pendingCallbackRef.current = onDone;
      interstitial.show().catch(() => {
        const cb = pendingCallbackRef.current;
        pendingCallbackRef.current = null;
        setIsLoaded(false);
        cb?.();
      });
    },
    [cooldownMs, isLoaded]
  );

  return { isLoaded, showIfReady };
}
