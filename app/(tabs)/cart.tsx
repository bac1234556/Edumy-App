// app/(tabs)/cart.tsx — Giỏ hàng (Read-only + Checkout on Web theo BR-M01)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <EmptyState
        icon={<Ionicons name="cart-outline" size={56} color="#94A3B8" />}
        title="Giỏ hàng trống"
        description="Bạn chưa chọn khóa học nào. Hãy khám phá danh mục để chọn khóa học phù hợp."
        actionTitle="Tìm khóa học"
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
