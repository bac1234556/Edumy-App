// src/components/ui/Input.tsx
import React from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Text } from './Text';
import { radius, semantic } from '../../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  labelRight?: React.ReactNode;
  error?: string;
  helperText?: string;
  rightAdornment?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  labelRight,
  error,
  helperText,
  rightAdornment,
  containerStyle,
  style,
  editable = true,
  ...rest
}: InputProps) {
  return (
    <View style={[styles.group, containerStyle]}>
      {(Boolean(label) || Boolean(labelRight)) && (
        <View style={styles.labelRow}>
          {label ? <Text variant="label">{label}</Text> : <View />}
          {labelRight}
        </View>
      )}

      <View style={styles.inputWrapper}>
        <TextInput
          placeholderTextColor={semantic.textPlaceholder}
          editable={editable}
          style={[
            styles.input,
            !editable && styles.readOnly,
            Boolean(rightAdornment) && styles.withRightAdornment,
            Boolean(error) && styles.inputError,
            style,
          ]}
          {...rest}
        />
        {rightAdornment && <View style={styles.adornment}>{rightAdornment}</View>}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    minHeight: 44,
    backgroundColor: semantic.surfaceCard,
    borderWidth: 1,
    borderColor: semantic.borderStrong,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: semantic.textPrimary,
  },
  readOnly: {
    backgroundColor: semantic.surfaceMuted,
    color: semantic.textMuted,
  },
  withRightAdornment: {
    paddingRight: 48,
  },
  inputError: {
    borderColor: semantic.danger,
  },
  adornment: {
    position: 'absolute',
    right: 6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: semantic.danger,
    lineHeight: 16,
  },
  helperText: {
    fontSize: 12,
    color: semantic.textMuted,
    lineHeight: 16,
  },
});
