import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CourseDetailScreen } from '../../../src/screens/CourseDetailScreen';

export default function Course() {
  const { id } = useLocalSearchParams();
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen, params) => {
      if (screen === 'Checkout') {
        router.push({
          pathname: '/(student)/checkout/[courseId]',
          params: { courseId: params?.courseId || id },
        });
      }
    },
  };
  return <CourseDetailScreen navigation={navigation} route={{ params: { courseId: Number(id) } }} />;
}
