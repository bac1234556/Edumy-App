// src/components/ui/ErrorState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  traceId?: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}

export function ErrorState({
  message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
  traceId,
  onRetry,
  icon,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      {icon}
      <Text style={styles.title}>Không thể tải dữ liệu</Text>
      <Text style={styles.message}>{message}</Text>
      {Boolean(traceId) && <Text style={styles.traceId}>Mã lỗi: {traceId}</Text>}
      {Boolean(onRetry) && (
        <Button
          title="Thử lại"
          onPress={onRetry!}
          variant="outline"
          style={styles.retryButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  traceId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    fontFamily: 'monospace',
  },
  retryButton: {
    marginTop: 20,
    minWidth: 140,
  },
});
