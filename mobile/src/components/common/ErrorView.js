import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export default function ErrorView({ message = 'Không thể tải dữ liệu.', onRetry }) {
  return <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
    <Text accessibilityRole="alert">{message}</Text>
    {onRetry && <Button mode="outlined" onPress={onRetry}>Thử lại</Button>}
  </View>;
}
