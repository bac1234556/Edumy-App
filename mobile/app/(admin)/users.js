import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { UserManagementScreen } from '../../src/screens/UserManagementScreen';

export default function Users() {
  const navigation = {
    goBack: () => router.back(),
  };

  return (
    <View style={{ flex: 1 }}>
      <UserManagementScreen navigation={navigation} />
    </View>
  );
}
