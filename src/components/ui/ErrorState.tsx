// src/components/ui/ErrorState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { parseAppError } from '../../api/problem';
import { semantic, radius, monoFontFamily, microShadow } from '../../theme/tokens';

interface ErrorStateProps {
  message?: string;
  traceId?: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
}

export function ErrorState({
  message,
  traceId,
  error,
  onRetry,
  retryLabel = 'Thử lại',
  icon,
}: ErrorStateProps) {
  const parsed = error ? parseAppError(error) : undefined;
  const resolvedMessage =
    message || parsed?.message || 'Đã có lỗi kết nối máy chủ. Vui lòng thử lại.';
  const resolvedTraceId = traceId || parsed?.traceId;

  return (
    <View style={styles.container}>
      <View style={[styles.box, microShadow]}>
        <View style={styles.iconFrame}>
          {icon || <Ionicons name="alert-circle-outline" size={26} color={semantic.danger} />}
        </View>
        <Text style={styles.title}>Không thể tải nội dung</Text>
        <Text style={styles.message}>{resolvedMessage}</Text>
        {Boolean(resolvedTraceId) && (
          <View style={styles.tracePill}>
            <Text style={styles.traceId}>Mã lỗi: {resolvedTraceId}</Text>
          </View>
        )}
        {Boolean(onRetry) && (
          <Button
            title={retryLabel}
            onPress={onRetry!}
            variant="outline"
            style={styles.retryButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: semantic.surfaceCanvas,
  },
  box: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.dangerBorder,
    padding: 24,
    alignItems: 'center',
  },
  iconFrame: {
    width: 48,
    height: 48,
    borderRadius: radius.btn,
    backgroundColor: semantic.dangerSoft,
    borderWidth: 1,
    borderColor: semantic.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: semantic.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: semantic.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  tracePill: {
    marginTop: 10,
    backgroundColor: semantic.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  traceId: {
    fontSize: 11,
    color: semantic.textMuted,
    fontFamily: monoFontFamily,
    fontVariant: ['tabular-nums'],
  },
  retryButton: {
    marginTop: 18,
    minWidth: 148,
  },
});
