import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export default function EmptyView({ message = 'Chưa có dữ liệu.', children }) {
  return <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
    <Text>{message}</Text>
    {children}
  </View>;
}
