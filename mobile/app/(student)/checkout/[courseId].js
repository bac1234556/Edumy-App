import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckoutScreen } from '../../../src/screens/CheckoutScreen';

export default function Checkout() {
  const { courseId } = useLocalSearchParams();
  return (
    <CheckoutScreen
      courseId={courseId ? Number(courseId) : null}
      onBack={() => router.back()}
      onDone={() => router.replace('/(student)/my-learning')}
    />
  );
}
