import React, { useCallback } from 'react';
import { View, Image } from 'react-native';
import { Badge, Button, Text } from 'react-native-paper';
import { avatarSource } from '../screens/ProfileScreen';
import { Redirect, Stack, router, useFocusEffect } from 'expo-router';
import { roleHome, useAuthStore } from '../store/authStore';
import { useNotificationsStore } from '../store/notificationsStore';
import { refreshUnreadCount } from '../api/notifications';

export function RoleLayout({ role }) {
  const session = useAuthStore((s) => s.session);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const refreshBadge = useCallback(() => {
    if (!session?.user?.id) return;
    refreshUnreadCount().catch(() => {});
  }, [session?.user?.id]);
  useFocusEffect(refreshBadge);
  if (!session) return <Redirect href="/(auth)" />;
  if (session.user.role !== role) return <Redirect href={roleHome(session.user.role)} />;
  return <View style={{ flex: 1 }}>
    <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {!!session.user.avatarUrl && <Image source={{ uri: avatarSource(session.user.avatarUrl) }} style={{ width: 32, height: 32, borderRadius: 16 }} />}
      <Text style={{ flex: 1 }}>{session.user.fullName}</Text>
      <Button onPress={() => router.push(`${roleHome(role)}/notifications`)} compact>
        <View style={{ position: 'relative' }}>
          <Text>Thông báo</Text>
          {unreadCount > 0 ? (
            <Badge style={{ position: 'absolute', top: -9, right: -13 }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          ) : null}
        </View>
      </Button>
      <Button onPress={() => router.push(roleHome(role))}>Trang chủ</Button>
      <Button onPress={() => router.push(`${roleHome(role)}/profile`)}>Hồ sơ</Button>
    </View>
    <Stack screenOptions={{ headerShown: false }} />
  </View>;
}
