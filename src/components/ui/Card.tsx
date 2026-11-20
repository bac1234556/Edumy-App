// src/components/ui/Card.tsx
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { microShadow, radius, semantic } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'soft';
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({
  children,
  variant = 'default',
  style,
  padded = true,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'soft' ? styles.soft : styles.default,
        padded && styles.padded,
        microShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    borderWidth: 1,
  },
  default: {
    backgroundColor: semantic.surfaceCard,
    borderColor: semantic.borderSubtle,
  },
  soft: {
    backgroundColor: semantic.brandSoft,
    borderColor: semantic.brandBorder,
  },
  padded: {
    padding: 16,
  },
});
