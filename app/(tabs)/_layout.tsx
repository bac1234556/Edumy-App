// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../src/store/session';
import { shouldShowInstructorTab } from '../../src/features/profile/logic';
import { useEarningsSummary } from '../../src/features/instructor/hooks';
import { semantic } from '../../src/theme/tokens';

export default function TabsLayout() {
  const { me } = useSessionStore();
  const { data: summary } = useEarningsSummary();
  const showInstructor = shouldShowInstructorTab(me, summary);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: semantic.surfaceCanvas,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: semantic.borderSubtle,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: semantic.textPrimary,
          letterSpacing: -0.35,
        },
        tabBarActiveTintColor: semantic.brandPrimary,
        tabBarInactiveTintColor: semantic.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: -0.1,
        },
        tabBarStyle: {
          backgroundColor: semantic.surfaceCard,
          borderTopWidth: 1,
          borderTopColor: semantic.borderSubtle,
          height: 64,
          paddingBottom: 9,
          paddingTop: 7,
          elevation: 0,
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
          title: 'Phòng học',
          tabBarLabel: 'Học tập',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Giỏ hàng đồng bộ',
          tabBarLabel: 'Giỏ hàng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="instructor"
        options={{
          title: 'Thu nhập Giảng viên',
          tabBarLabel: 'Giảng viên',
          href: showInstructor ? '/(tabs)/instructor' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản & Bảo mật',
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
