// src/components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { radius, semantic } from '../../theme/tokens';

export type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; border: string; text: string }> = {
  info: {
    bg: semantic.brandSoft,
    border: semantic.brandBorder,
    text: semantic.brandPrimary,
  },
  success: {
    bg: semantic.successSoft,
    border: semantic.successBorder,
    text: semantic.success,
  },
  warning: {
    bg: semantic.warningSoft,
    border: semantic.warningBorder,
    text: semantic.warning,
  },
  danger: {
    bg: semantic.dangerSoft,
    border: semantic.dangerBorder,
    text: semantic.danger,
  },
  neutral: {
    bg: semantic.surfaceMuted,
    border: semantic.borderSubtle,
    text: semantic.textSecondary,
  },
};

export function Badge({
  label,
  variant = 'neutral',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const palette = VARIANT_STYLES[variant];
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          { color: palette.text },
          Boolean(icon) && styles.textWithIcon,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  textWithIcon: {
    marginLeft: 4,
  },
});
