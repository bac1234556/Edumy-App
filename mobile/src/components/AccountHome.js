import React from 'react';
import { ScrollView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { HealthCard } from './HealthCard';

export function AccountHome({ title, children }) {
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  const logout = async () => {
    try {
      if (session) await authClient.post('/auth/logout', { refreshToken: session.refreshToken });
    } catch { /* Offline logout still clears local credentials. */ }
    await clearSession();
    queryClient.clear();
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text variant="headlineMedium">{title}</Text>
        <Text>Xin chào, {session?.user.fullName}</Text>
        <Text>{session?.user.email}</Text>
        <HealthCard />
        {children}
        <Button mode="outlined" onPress={logout}>Đăng xuất</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
