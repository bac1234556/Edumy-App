import React from 'react';
import { router } from 'expo-router';
import { HomeScreen } from '../../src/screens/HomeScreen';

export default function Catalog() {
  const navigation = {
    navigate: (screen, params) => router.push({ pathname: '/(student)/courses/[id]', params: { id: params?.courseId || 1 } }),
    goBack: () => router.back(),
  };
  return <HomeScreen navigation={navigation} />;
}
