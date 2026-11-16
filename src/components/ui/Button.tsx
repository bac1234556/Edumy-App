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
}: ButtonProps) {
  const isInteractive = !loading && !disabled;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'secondary' ? semantic.textPrimary : '#FFFFFF'}
        />
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
    minHeight: 46,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: semantic.brandPrimary,
    borderColor: semantic.brandPrimaryStrong,
  },
  secondary: {
    backgroundColor: '#F1F5F9',
    borderColor: semantic.borderSubtle,
  },
  outline: {
    backgroundColor: semantic.surfaceCard,
    borderWidth: 1,
    borderColor: semantic.borderStrong,
  },
  danger: {
    backgroundColor: semantic.danger,
    borderColor: '#B91C1C',
  },
  disabled: {
    backgroundColor: '#F1F5F9',
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
    color: semantic.textPrimary,
  },
  outlineText: {
    color: semantic.textPrimary,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#94A3B8',
  },
  textWithIcon: {
    marginLeft: 8,
  },
});
