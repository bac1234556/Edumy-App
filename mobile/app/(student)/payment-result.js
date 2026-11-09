import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { PaymentResultScreen } from '../../src/screens/PaymentResultScreen';

export default function PaymentResult() {
  const params = useLocalSearchParams();
  const result = params.courseId ? { ...params, courseId: Number(params.courseId) } : null;
  return (
    <PaymentResultScreen
      result={result}
      onLearn={(courseId) => router.replace({ pathname: '/(student)/learn/[courseId]', params: { courseId } })}
      onMyLearning={() => router.replace('/(student)/my-learning')}
      onHome={() => router.replace('/(student)')}
    />
  );
}
