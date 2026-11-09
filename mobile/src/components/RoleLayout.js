import React from 'react';
import { View, Image } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { avatarSource } from '../screens/ProfileScreen';
import { Redirect, Stack, router } from 'expo-router';
import { roleHome, useAuthStore } from '../store/authStore';

export function RoleLayout({ role }) {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Redirect href="/(auth)" />;
  if (session.user.role !== role) return <Redirect href={roleHome(session.user.role)} />;
  return <View style={{ flex: 1 }}>
    <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {!!session.user.avatarUrl && <Image source={{ uri: avatarSource(session.user.avatarUrl) }} style={{ width: 32, height: 32, borderRadius: 16 }} />}
      <Text style={{ flex: 1 }}>{session.user.fullName}</Text>
      <Button onPress={() => router.push(roleHome(role))}>Trang chủ</Button>
      <Button onPress={() => router.push(`${roleHome(role)}/profile`)}>Hồ sơ</Button>
    </View>
    <Stack screenOptions={{ headerShown: false }} />
  </View>;
}
