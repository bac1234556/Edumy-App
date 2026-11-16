import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { PaymentResultScreen } from '../../src/screens/PaymentResultScreen';

export default function PaymentResult() {
  // Từ Checkout: đủ thông tin đơn. Từ deep link VNPay (edumy://payment-result?status=..&txnRef=..): chỉ có txnRef.
  const params = useLocalSearchParams();
  const result = params.courseId ? { ...params, courseId: Number(params.courseId) } : null;
  return (
    <PaymentResultScreen
      result={result}
      txnRef={params.txnRef || null}
      onLearn={(courseId) => router.replace({ pathname: '/(student)/learn/[courseId]', params: { courseId } })}
      onMyLearning={() => router.replace('/(student)/my-learning')}
      onHome={() => router.replace('/(student)')}
      onRetry={(courseId) => router.replace({ pathname: '/(student)/checkout/[courseId]', params: { courseId } })}
    />
  );
}
