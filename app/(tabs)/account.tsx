// app/(tabs)/account.tsx — Tài khoản cá nhân
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { useSessionStore } from '../../src/store/session';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const { me, status } = useSessionStore();
  const isLoggedIn = status === 'authenticated' && me !== null;

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#0D9488" />
        </View>
        <View style={styles.profileInfo}>
          <Text variant="h3">
            {isLoggedIn ? me?.fullName : 'Khách vãng lai'}
          </Text>
          <Text variant="bodySmall">
            {isLoggedIn ? me?.email : 'Đăng nhập để đồng bộ tiến độ học và giỏ hàng'}
          </Text>
        </View>
      </View>

      {!isLoggedIn && (
        <View style={styles.authActionBox}>
          <Button
            title="Đăng nhập"
            onPress={() => {
              // Navigate to auth
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  authActionBox: {
    marginTop: 20,
  },
});
