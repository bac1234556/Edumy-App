import React from 'react';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { AccountHome } from '../../src/components/AccountHome';

export default function StudentHome() {
  return <AccountHome title="Góc học viên"><Button mode="contained" onPress={() => router.push('/(student)/catalog')}>Khám phá khóa học</Button></AccountHome>;
}
