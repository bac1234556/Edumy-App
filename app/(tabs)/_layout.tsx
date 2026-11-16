// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../src/store/session';
import { shouldShowInstructorTab } from '../../src/features/profile/logic';
import { useEarningsSummary } from '../../src/features/instructor/hooks';

export default function TabsLayout() {
  const { me } = useSessionStore();
  const { data: summary } = useEarningsSummary();
  const showInstructor = shouldShowInstructorTab(me, summary);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#0F172A' },
        tabBarActiveTintColor: '#0D9488',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Khám phá',
          tabBarLabel: 'Khám phá',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-learning"
        options={{
          title: 'Học tập',
          tabBarLabel: 'Học tập',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Giỏ hàng',
          tabBarLabel: 'Giỏ hàng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="instructor"
        options={{
          title: 'Giảng viên',
          tabBarLabel: 'Giảng viên',
          href: showInstructor ? '/(tabs)/instructor' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
