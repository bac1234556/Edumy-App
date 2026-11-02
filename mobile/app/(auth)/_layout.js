import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { roleHome, useAuthStore } from '../../src/store/authStore';

export default function AuthLayout() {
  const session = useAuthStore((s) => s.session);
  return session ? <Redirect href={roleHome(session.user.role)} /> : <Stack screenOptions={{ headerShown: false }} />;
}
