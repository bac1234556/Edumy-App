// src/components/ui/Text.tsx
import React from 'react';
import { Text as RNText, StyleSheet, TextStyle, TextProps as RNTextProps } from 'react-native';

interface CustomTextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label';
  style?: TextStyle;
  children: React.ReactNode;
}

export function Text({ variant = 'body', style, children, ...props }: CustomTextProps) {
  return (
    <RNText style={[styles[variant], style]} {...props}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: '#334155',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
});
