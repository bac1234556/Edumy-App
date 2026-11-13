import React from 'react';
import { router } from 'expo-router';
import { HomeScreen } from '../../src/screens/HomeScreen';

export default function Catalog() {
  const navigation = {
    navigate: (screen, params) => {
      if (screen === 'Search') {
        router.push({
          pathname: '/(student)/search',
          params: { initialKeyword: params?.initialKeyword || '' },
        });
      } else if (screen === 'Wishlist') {
        router.push('/(student)/wishlist');
      } else if (screen === 'CourseDetail') {
        router.push({
          pathname: '/(student)/courses/[id]',
          params: { id: params?.courseId || 1 },
        });
      } else {
        router.push({
          pathname: '/(student)/courses/[id]',
          params: { id: params?.courseId || 1 },
        });
      }
    },
    goBack: () => router.back(),
  };
  return <HomeScreen navigation={navigation} />;
}
