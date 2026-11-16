// app/(tabs)/my-learning.tsx — Học tập
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MyLearningScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <EmptyState
        icon={<Ionicons name="book-outline" size={56} color="#94A3B8" />}
        title="Chưa có khóa học nào"
        description="Ghi danh các khóa học trên Edumy để bắt đầu hành trình học tập của bạn."
        actionTitle="Khám phá ngay"
        onAction={() => router.push('/')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
});
