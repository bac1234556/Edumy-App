import React from 'react';
import { router } from 'expo-router';
import { MyLearningScreen } from '../../src/screens/MyLearningScreen';

export default function MyLearning() {
  return (
    <MyLearningScreen
      onBack={() => router.back()}
      onExplore={() => router.push('/(student)/catalog')}
      onOpenCourse={(item) => router.push({ pathname: '/(student)/courses/[id]', params: { id: item.courseId } })}
    />
  );
}
