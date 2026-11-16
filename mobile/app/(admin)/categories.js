import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { CategoryManagementScreen } from '../../src/screens/CategoryManagementScreen';

export default function Categories() {
  return (
    <View style={{ flex: 1 }}>
      <CategoryManagementScreen navigation={{ goBack: () => router.back() }} />
    </View>
  );
}
