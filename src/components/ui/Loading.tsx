// src/components/ui/Loading.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { semantic } from '../../theme/tokens';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Đang đồng bộ dữ liệu...' }: LoadingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="small" color={semantic.brandPrimary} />
        {Boolean(message) && <Text style={styles.text}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: semantic.surfaceCanvas,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: semantic.surfaceCard,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  text: {
    fontSize: 13,
    color: semantic.textSecondary,
    fontWeight: '600',
  },
});
