// src/components/ui/ResponsiveContainer.tsx
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { layout } from '../../theme/tokens';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export function ResponsiveContainer({
  children,
  maxWidth = layout.maxContentWidth,
  style,
}: ResponsiveContainerProps) {
  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.inner, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
});
