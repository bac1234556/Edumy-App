import React from 'react';
import { router } from 'expo-router';
import { NotificationsScreen } from '../../src/screens/NotificationsScreen';

export default function Notifications() {
  return <NotificationsScreen onBack={() => router.back()} />;
}
