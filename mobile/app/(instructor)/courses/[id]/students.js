import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { InstructorStudentsScreen } from '../../../../src/screens/InstructorStudentsScreen';

export default function InstructorCourseStudents() {
  const { id, title } = useLocalSearchParams();
  return (
    <InstructorStudentsScreen
      courseId={id}
      courseTitle={title}
      onBack={() => router.back()}
    />
  );
}
