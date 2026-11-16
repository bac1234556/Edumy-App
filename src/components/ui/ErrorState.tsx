// src/components/ui/ErrorState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { semantic, radius, monoFontFamily } from '../../theme/tokens';

interface ErrorStateProps {
  message?: string;
  traceId?: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}

export function ErrorState({
  message = 'Đã có lỗi kết nối máy chủ. Vui lòng thử lại.',
  traceId,
  onRetry,
  icon,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <View style={styles.iconFrame}>
          {icon || <Ionicons name="alert-circle-outline" size={26} color={semantic.danger} />}
        </View>
        <Text style={styles.kicker}>GIÁN ĐOẠN DỮ LIỆU</Text>
        <Text style={styles.title}>Không thể tải nội dung</Text>
        <Text style={styles.message}>{message}</Text>
        {Boolean(traceId) && <Text style={styles.traceId}>TRACE: {traceId}</Text>}
        {Boolean(onRetry) && (
          <Button
            title="Thử lại ngay"
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
    maxWidth: 400,
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 24,
    alignItems: 'center',
  },
  iconFrame: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: semantic.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.danger,
    letterSpacing: 0.8,
    marginBottom: 4,
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
    lineHeight: 19,
  },
  traceId: {
    fontSize: 11,
    color: semantic.textMuted,
    marginTop: 8,
    fontFamily: monoFontFamily,
    fontVariant: ['tabular-nums'],
  },
  retryButton: {
    marginTop: 18,
    minWidth: 148,
  },
});
