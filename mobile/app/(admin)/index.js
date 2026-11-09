import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AdminDashboardScreen } from '../../src/screens/AdminDashboardScreen';

export default function AdminHome() {
  const navigation = {
    navigate: (screen) => {
      if (screen === 'UserManagement') {
        router.push('/(admin)/users');
      } else if (screen === 'CourseReviewQueue') {
        router.push('/(admin)/review-queue');
      }
    },
    goBack: () => router.back(),
  };

  return (
    <View style={{ flex: 1 }}>
      <AdminDashboardScreen navigation={navigation} />
    </View>
  );
}
