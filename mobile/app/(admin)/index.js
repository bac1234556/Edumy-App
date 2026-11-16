import React from 'react';
import { useRouter } from 'expo-router';
import { AdminDashboardScreen } from '../../src/screens/AdminDashboardScreen';

export default function AdminHome() {
  const router = useRouter();
  const navigation = {
    navigate: (screen) => {
      if (screen === 'UserManagement') {
        router.push('/(admin)/users');
      } else if (screen === 'CourseReviewQueue') {
        router.push('/(admin)/review-queue');
      } else if (screen === 'CategoryManagement') {
        router.push('/(admin)/categories');
      }
    },
    goBack: () => router.back(),
  };

  return <AdminDashboardScreen navigation={navigation} />;
}
