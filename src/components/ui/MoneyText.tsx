// src/components/ui/MoneyText.tsx
import React from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { formatVnd } from '../../lib/money';
import { semantic, monoFontFamily } from '../../theme/tokens';

interface MoneyTextProps {
  amount: number | null | undefined;
  style?: StyleProp<TextStyle>;
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
    fontFamily: monoFontFamily,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  paid: {
    color: semantic.textPrimary,
    fontSize: 15,
  },
  free: {
    color: semantic.brandPrimary,
    fontSize: 14,
  },
});
