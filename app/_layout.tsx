// app/_layout.tsx
import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRestoreSession } from '../src/features/auth/hooks';
import { useForegroundSync } from '../src/hooks/useForegroundSync';
import { Loading } from '../src/components/ui/Loading';
import { Screen } from '../src/components/ui/Screen';

function RootNavigator() {
  const { isRestored } = useRestoreSession();
  useForegroundSync();

  if (!isRestored) {
    return (
      <Screen>
        <Loading message="Đang khởi động Edumy..." />
      </Screen>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#FAF9F6' },
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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            retry: 2,
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
