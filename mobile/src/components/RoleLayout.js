import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { roleHome, useAuthStore } from '../store/authStore';

export function RoleLayout({ role }) {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Redirect href="/(auth)" />;
  if (session.user.role !== role) return <Redirect href={roleHome(session.user.role)} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
