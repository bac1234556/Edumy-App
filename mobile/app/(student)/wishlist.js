import React from 'react';
import { router } from 'expo-router';
import { WishlistScreen } from '../../src/screens/WishlistScreen';

export default function Wishlist() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen, params) => {
      if (screen === 'CourseDetail') {
        router.push({
          pathname: '/(student)/courses/[id]',
          params: { id: params.courseId },
        });
      } else if (screen === 'Home') {
        router.push('/(student)');
      }
    },
  };

  return <WishlistScreen navigation={navigation} />;
}
