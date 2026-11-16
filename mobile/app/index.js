import React from 'react';
import { Redirect } from 'expo-router';
import { roleHome, useAuthStore } from '../src/store/authStore';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  return <Redirect href={session ? roleHome(session.user.role) : '/(auth)'} />;
}
