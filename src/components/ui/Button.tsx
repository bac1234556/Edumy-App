// src/components/ui/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { semantic, radius } from '../../theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
}: ButtonProps) {
  const isInteractive = !loading && !disabled;

  const spinnerColor =
    variant === 'outline'
      ? semantic.textPrimary
      : variant === 'secondary'
        ? semantic.brandPrimaryStrong
        : '#FFFFFF';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.textBase,
              styles[`${variant}Text` as keyof typeof styles] as TextStyle,
              disabled && styles.disabledText,
              Boolean(icon) && styles.textWithIcon,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.btn,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: semantic.brandPrimary,
    borderColor: semantic.brandPrimary,
  },
  secondary: {
    backgroundColor: semantic.brandSoft,
    borderColor: semantic.brandBorder,
  },
  outline: {
    backgroundColor: semantic.surfaceCard,
    borderColor: semantic.borderStrong,
  },
  danger: {
    backgroundColor: semantic.danger,
    borderColor: semantic.danger,
  },
  disabled: {
    backgroundColor: semantic.surfaceMuted,
    borderColor: semantic.borderSubtle,
  },
  textBase: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: semantic.brandPrimaryStrong,
  },
  outlineText: {
    color: semantic.textPrimary,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: semantic.textPlaceholder,
  },
  textWithIcon: {
    marginLeft: 8,
  },
});
