// app/_layout.tsx
import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRestoreSession } from '../src/features/auth/hooks';
import { useForegroundSync } from '../src/hooks/useForegroundSync';
import { Loading } from '../src/components/ui/Loading';
import { Screen } from '../src/components/ui/Screen';
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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2,
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
