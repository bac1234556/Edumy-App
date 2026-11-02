import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CourseDetailScreen } from '../../../src/screens/CourseDetailScreen';

export default function Course() {
  const { id } = useLocalSearchParams();
  return <CourseDetailScreen navigation={{ goBack: () => router.back() }} route={{ params: { courseId: Number(id) } }} />;
}
