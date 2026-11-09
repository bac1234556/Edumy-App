import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CoursePlayerScreen } from '../../../src/screens/CoursePlayerScreen';

export default function Learn() {
  const { courseId, lessonId } = useLocalSearchParams();
  return (
    <CoursePlayerScreen
      courseId={Number(courseId)}
      initialLessonId={lessonId ? Number(lessonId) : null}
      onBack={() => router.back()}
      onBuy={(id) => router.replace({ pathname: '/(student)/courses/[id]', params: { id } })}
    />
  );
}
