import React from 'react';
import { router } from 'expo-router';
import { InstructorDashboardScreen } from '../../src/screens/InstructorDashboardScreen';

export default function InstructorHome() {
  return (
    <InstructorDashboardScreen
      onOpenStudents={(course) => router.push({
        pathname: '/(instructor)/courses/[id]/students',
        params: { id: String(course.id), title: course.title },
      })}
      onOpenNotifications={() => router.push('/(instructor)/notifications')}
    />
  );
}
