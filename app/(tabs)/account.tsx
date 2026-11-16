// app/(tabs)/account.tsx — Tài khoản cá nhân
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { useSessionStore } from '../../src/store/session';
import { useLogout, useMe } from '../../src/features/auth/hooks';
import { useResendVerificationEmail } from '../../src/features/profile/hooks';
import { AppError } from '../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const router = useRouter();
  const { me, status } = useSessionStore();
  const { refetch } = useMe();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { mutate: resendEmail, isPending: isResending } = useResendVerificationEmail();

  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const isLoggedIn = status === 'authenticated' && me !== null;

  // Countdown timer for resend email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendVerification = () => {
    setResendMessage(null);
    resendEmail(undefined, {
      onSuccess: () => {
        setResendMessage('Đã gửi lại thư xác thực. Vui lòng kiểm tra email của bạn.');
        setResendCooldown(60);
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        if (appErr.status === 429 || appErr.retryAfterSec) {
          setResendCooldown(appErr.retryAfterSec || 60);
          setResendMessage(`Vui lòng chờ ${appErr.retryAfterSec || 60} giây trước khi gửi lại.`);
        } else {
          setResendMessage(appErr.message || 'Không thể gửi lại thư xác thực.');
        }
      },
    });
  };

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color="#0D9488" />
        </View>
        <View style={styles.profileInfo}>
          <Text variant="h3">
            {isLoggedIn ? me?.fullName : 'Khách vãng lai'}
          </Text>
          <Text variant="bodySmall" style={styles.emailText}>
            {isLoggedIn ? me?.email : 'Đăng nhập để đồng bộ tiến độ học và giỏ hàng'}
          </Text>
          {isLoggedIn && me?.roles && (
            <View style={styles.rolesContainer}>
              {me.roles.map((role) => (
                <View key={role} style={styles.roleBadge}>
                  <Text style={styles.roleText}>{role.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Email Verification Banner */}
      {isLoggedIn && me?.emailVerified === false && (
        <View style={styles.unverifiedBanner}>
          <View style={styles.bannerRow}>
            <Ionicons name="warning-outline" size={20} color="#D97706" />
            <Text style={styles.bannerTitle}>Email chưa xác thực</Text>
          </View>
          <Text style={styles.bannerDesc}>
            Vui lòng xác thực email để bảo mật tài khoản và nhận chứng chỉ hoàn thành.
          </Text>
          {resendMessage && (
            <Text style={styles.resendNotice}>{resendMessage}</Text>
          )}
          <Button
            title={
              resendCooldown > 0
                ? `Gửi lại sau (${resendCooldown}s)`
                : 'Gửi lại thư xác thực'
            }
            variant="outline"
            disabled={resendCooldown > 0 || isResending}
            loading={isResending}
            onPress={handleResendVerification}
            style={styles.resendBtn}
            textStyle={styles.resendBtnText}
          />
        </View>
      )}

      {/* Action / Menu Items */}
      {!isLoggedIn ? (
        <View style={styles.authBox}>
          <Button
            title="Đăng nhập"
            onPress={() => router.push('/(auth)/login')}
          />
          <Button
            title="Đăng ký tài khoản"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
          />
        </View>
      ) : (
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/account/profile')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-circle-outline" size={22} color="#475569" />
              <Text style={styles.menuItemText}>Hồ sơ cá nhân</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/account/change-password')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#475569" />
              <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/orders' as const)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="receipt-outline" size={22} color="#475569" />
              <Text style={styles.menuItemText}>Lịch sử đơn hàng</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/account/certificates' as const)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="ribbon-outline" size={22} color="#475569" />
              <Text style={styles.menuItemText}>Chứng chỉ của tôi</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => refetch()}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="refresh-outline" size={22} color="#475569" />
              <Text style={styles.menuItemText}>Làm mới thông tin</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.logoutWrapper}>
            <Button
              title="Đăng xuất"
              variant="outline"
              loading={isLoggingOut}
              onPress={handleLogout}
              style={styles.logoutBtn}
              textStyle={styles.logoutBtnText}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  content: {
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  emailText: {
    marginTop: 2,
  },
  rolesContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  unverifiedBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  bannerDesc: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 4,
    lineHeight: 18,
  },
  resendNotice: {
    fontSize: 12,
    color: '#0D9488',
    marginTop: 6,
    fontWeight: '600',
  },
  resendBtn: {
    marginTop: 10,
    minHeight: 38,
    borderColor: '#F59E0B',
  },
  resendBtnText: {
    color: '#B45309',
    fontSize: 13,
  },
  authBox: {
    marginTop: 24,
    gap: 12,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  logoutWrapper: {
    padding: 16,
  },
  logoutBtn: {
    borderColor: '#EF4444',
  },
  logoutBtnText: {
    color: '#EF4444',
  },
});
