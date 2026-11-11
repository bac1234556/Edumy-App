import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

export default function LoadingView({ message = 'Đang tải...' }) {
  return <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
    <ActivityIndicator accessibilityLabel={message} />
    <Text>{message}</Text>
  </View>;
}
