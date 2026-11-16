import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CertificateScreen } from '../../../src/screens/CertificateScreen';

export default function Certificate() {
  const { courseId } = useLocalSearchParams();
  return <CertificateScreen courseId={courseId ? Number(courseId) : null} onBack={() => router.back()} />;
}
