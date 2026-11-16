// app/(tabs)/account.tsx — Tài khoản cá nhân
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { useSessionStore } from '../../src/store/session';
import { useLogout } from '../../src/features/auth/hooks';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const router = useRouter();
  const { me, status } = useSessionStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const isLoggedIn = status === 'authenticated' && me !== null;

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

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

      {!isLoggedIn ? (
        <View style={styles.authActionBox}>
          <Button
            title="Đăng nhập"
            onPress={() => router.push('/(auth)/login')}
          />
          <Button
            title="Đăng ký tài khoản"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
            style={styles.registerButton}
          />
        </View>
      ) : (
        <View style={styles.authActionBox}>
          <Button
            title="Đăng xuất"
            variant="outline"
            loading={isLoggingOut}
            onPress={handleLogout}
            style={styles.logoutButton}
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
    marginTop: 24,
    gap: 12,
  },
  registerButton: {
    marginTop: 0,
  },
  logoutButton: {
    borderColor: '#EF4444',
  },
});
