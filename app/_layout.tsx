// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Network from 'expo-network';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
  useQueryClient,
} from '@tanstack/react-query';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRestoreSession } from '../src/features/auth/hooks';
import { useForegroundSync } from '../src/hooks/useForegroundSync';
import { Loading } from '../src/components/ui/Loading';
import { Screen } from '../src/components/ui/Screen';
import { Text } from '../src/components/ui/Text';
import { parseAppError } from '../src/api/problem';
import { subscribeSessionExpired, useSessionStore } from '../src/store/session';
import { notify } from '../src/lib/dialog';
import { semantic } from '../src/theme/tokens';

function RootNavigator() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useSessionStore((s) => s.status);
  const { isRestored, isRetrying, retryRestore } = useRestoreSession();
  useForegroundSync();

  useEffect(() => {
    return subscribeSessionExpired(() => {
      queryClient.clear();
      router.replace('/(auth)/login');
      void notify(
        'Phiên đăng nhập đã hết hạn',
        'Phiên làm việc của bạn đã kết thúc. Vui lòng đăng nhập lại để tiếp tục.'
      );
    });
  }, [queryClient, router]);

  if (!isRestored) {
    return (
      <Screen>
        <Loading message="Đang khởi tạo không gian học tập Edumy..." />
      </Screen>
    );
  }

  return (
    <View style={styles.rootContainer}>
      {status === 'offline' && (
        <SafeAreaView edges={['top']} style={styles.offlineBannerWrap}>
          <View style={styles.offlineBanner}>
            <View style={styles.offlineLeft}>
              <Ionicons name="cloud-offline-outline" size={18} color="#92400E" />
              <Text style={styles.offlineText}>Không kết nối được máy chủ</Text>
            </View>
            <TouchableOpacity
              onPress={retryRestore}
              disabled={isRetrying}
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel="Thử lại kết nối máy chủ"
            >
              <Text style={styles.retryText}>{isRetrying ? 'Đang thử...' : 'Thử lại'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      <View style={styles.stackWrap}>
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
      </View>
    </View>
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

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  offlineBannerWrap: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  offlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  offlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#D97706',
    minHeight: 32,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stackWrap: {
    flex: 1,
  },
});
