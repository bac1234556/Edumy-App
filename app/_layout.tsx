// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as Network from 'expo-network';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRestoreSession } from '../src/features/auth/hooks';
import { useForegroundSync } from '../src/hooks/useForegroundSync';
import { Loading } from '../src/components/ui/Loading';
import { Screen } from '../src/components/ui/Screen';
import { parseAppError } from '../src/api/problem';
import { semantic } from '../src/theme/tokens';

function RootNavigator() {
  const { isRestored } = useRestoreSession();
  useForegroundSync();

  if (!isRestored) {
    return (
      <Screen>
        <Loading message="Đang khởi tạo không gian học tập Edumy..." />
      </Screen>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: semantic.surfaceCanvas },
        headerShadowVisible: false,
        headerTintColor: semantic.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        contentStyle: { backgroundColor: semantic.surfaceCanvas },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(auth)/login"
        options={{ title: 'Đăng nhập', headerShown: false }}
      />
      <Stack.Screen
        name="(auth)/register"
        options={{ title: 'Đăng ký', headerShown: false }}
      />
      <Stack.Screen
        name="(auth)/forgot-password"
        options={{ title: 'Quên mật khẩu', headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return onlineManager.setEventListener((setOnline) => {
      let active = true;
      const syncNetwork = async () => {
        try {
          const state = await Network.getNetworkStateAsync();
          if (active) {
            setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
          }
        } catch {
          // Ignore network probe failures
        }
      };

      syncNetwork();

      const appStateSub = AppState.addEventListener('change', (status: AppStateStatus) => {
        if (status === 'active') {
          syncNetwork();
        }
      });

      let webCleanup: (() => void) | undefined;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const onOnline = () => setOnline(true);
        const onOffline = () => setOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        webCleanup = () => {
          window.removeEventListener('online', onOnline);
          window.removeEventListener('offline', onOffline);
        };
      }

      return () => {
        active = false;
        appStateSub.remove();
        webCleanup?.();
      };
    });
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2,
            retry: (failureCount, error) => {
              if (failureCount >= 2) return false;
              const appErr = parseAppError(error);
              return (
                appErr.kind === 'network' ||
                appErr.kind === 'timeout' ||
                (appErr.status ?? 0) >= 500
              );
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
