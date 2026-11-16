// src/components/ui/Text.tsx
import React from 'react';
import {
  Text as RNText,
  StyleSheet,
  TextStyle,
  StyleProp,
  TextProps as RNTextProps,
} from 'react-native';
import { semantic, monoFontFamily } from '../../theme/tokens';

interface CustomTextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label' | 'overline' | 'mono';
  tabular?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  tabular = false,
  style,
  children,
  ...props
}: CustomTextProps) {
  return (
    <RNText
      style={[
        styles[variant],
        tabular && styles.tabular,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: semantic.textPrimary,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  h2: {
    fontSize: 19,
    fontWeight: '700',
    color: semantic.textPrimary,
    letterSpacing: -0.35,
    lineHeight: 25,
  },
  h3: {
    fontSize: 15,
    fontWeight: '700',
    color: semantic.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: semantic.textSecondary,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    color: semantic.textSecondary,
    lineHeight: 19,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: semantic.textMuted,
    lineHeight: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: semantic.textPrimary,
    lineHeight: 18,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  mono: {
    fontFamily: monoFontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: semantic.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
