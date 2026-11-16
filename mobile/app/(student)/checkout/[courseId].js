import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckoutScreen } from '../../../src/screens/CheckoutScreen';

export default function Checkout() {
  const { courseId } = useLocalSearchParams();
  return (
    <CheckoutScreen
      courseId={courseId ? Number(courseId) : null}
      onBack={() => router.back()}
      onSuccess={(result) => router.replace({
        pathname: '/(student)/payment-result',
        params: {
          courseId: String(result.courseId),
          courseTitle: result.courseTitle || '',
          status: result.status || '',
          txnRef: result.txnRef || '',
          amount: String(result.amount ?? 0),
        },
      })}
      onLearn={(id) => router.replace({ pathname: '/(student)/learn/[courseId]', params: { courseId: id } })}
    />
  );
}
