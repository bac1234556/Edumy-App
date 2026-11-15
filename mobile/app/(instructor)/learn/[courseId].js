import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CoursePlayerScreen } from '../../../src/screens/CoursePlayerScreen';

export default function InstructorLearn() {
  const { courseId, lessonId } = useLocalSearchParams();
  return (
    <CoursePlayerScreen
      courseId={Number(courseId)}
      initialLessonId={lessonId ? Number(lessonId) : null}
      role="INSTRUCTOR"
      onBack={() => router.back()}
    />
  );
}
