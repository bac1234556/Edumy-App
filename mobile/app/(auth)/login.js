import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AuthScreen } from '../../src/screens/AuthScreen';

export default function Login() {
  const { email, registered } = useLocalSearchParams();
  return <AuthScreen initialEmail={typeof email === 'string' ? email : ''} registered={registered === '1'} />;
}
