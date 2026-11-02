import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '../src/theme';
import { api } from '../src/api/client';
import { useAuthStore } from '../src/store/authStore';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export default function RootLayout() {
  const hydrated = useAuthStore((s) => s.hydrated);
  useEffect(() => {
    useAuthStore.getState().hydrate().then(async () => {
      const session = useAuthStore.getState().session;
      if (!session) return;
      try {
        const { data } = await api.get('/users/me');
        const current = useAuthStore.getState().session;
        if (current?.user.id === session.user.id) {
          await useAuthStore.getState().setSession({ ...current, user: data.data });
        }
      } catch { /* API interceptor handles invalid sessions; offline users can retry. */ }
    });
  }, []);
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          {hydrated ? <Stack screenOptions={{ headerShown: false }} /> : (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <ActivityIndicator accessibilityLabel="Đang khôi phục phiên đăng nhập" />
            </View>
          )}
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
