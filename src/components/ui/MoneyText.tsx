// src/components/ui/MoneyText.tsx
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { formatVnd } from '../../lib/money';

interface MoneyTextProps {
  amount: number | null | undefined;
  style?: TextStyle;
}

export function MoneyText({ amount, style }: MoneyTextProps) {
  const isFree = amount === 0;
  return (
    <Text
      style={[
        styles.base,
        isFree ? styles.free : styles.paid,
        style,
      ]}
    >
      {formatVnd(amount)}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  paid: {
    color: '#0D9488', // Deep teal accent
    fontSize: 16,
  },
  free: {
    color: '#16A34A', // Vibrant green
    fontSize: 15,
  },
});
