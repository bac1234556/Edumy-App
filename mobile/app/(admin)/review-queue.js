import React from 'react';
import { router } from 'expo-router';
import { ReviewQueueScreen } from '../../src/screens/ReviewQueueScreen';

export default function ReviewQueue() {
  return <ReviewQueueScreen onBack={() => router.back()} />;
}
