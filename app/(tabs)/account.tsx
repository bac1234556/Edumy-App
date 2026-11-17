// app/(tabs)/account.tsx — Tài khoản & Bảo mật (Swiss Editorial Console)
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { confirm } from '../../src/lib/dialog';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { useSessionStore } from '../../src/store/session';
import { useLogout, useMe } from '../../src/features/auth/hooks';
import { useResendVerificationEmail } from '../../src/features/profile/hooks';
import { AppError } from '../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';
import { semantic, radius, monoFontFamily } from '../../src/theme/tokens';

export default function AccountScreen() {
  const router = useRouter();
  const { me, status } = useSessionStore();
  const { refetch } = useMe();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { mutate: resendEmail, isPending: isResending } = useResendVerificationEmail();

  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const isLoggedIn = status === 'authenticated' && me !== null;

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
        setResendMessage('Đã gửi lại thư xác thực. Vui lòng kiểm tra hộp thư email của bạn.');
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

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn kết thúc phiên đăng nhập trên thiết bị này?',
      confirmText: 'Đăng xuất',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (ok) {
      logout();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Editorial Profile Identity Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={28} color={semantic.brandPrimaryStrong} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.identityOverline}>
            {isLoggedIn ? `ID TÀI KHOẢN // #${me?.id}` : 'CHẾ ĐỘ KHÁCH // ANONYMOUS'}
          </Text>
          <Text variant="h2" style={styles.fullNameText}>
            {isLoggedIn ? me?.fullName : 'Khách vãng lai'}
          </Text>
          <Text variant="bodySmall" style={styles.emailText}>
            {isLoggedIn ? me?.email : 'Đăng nhập để đồng bộ tiến độ học và chứng chỉ'}
          </Text>
          {isLoggedIn && me?.roles && (
            <View style={styles.rolesContainer}>
              {me.roles.map((role) => (
                <View key={role} style={styles.roleBadge}>
                  <Text style={styles.roleText}>{role.toUpperCase()}</Text>
                </View>
              ))}
              {me.emailVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={semantic.success} />
                  <Text style={styles.verifiedBadgeText}>ĐÃ XÁC THỰC EMAIL</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Email Verification Banner */}
      {isLoggedIn && me?.emailVerified === false && (
        <View style={styles.unverifiedBanner}>
          <View style={styles.bannerRow}>
            <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
            <Text style={styles.bannerTitle}>ĐỊA CHỈ EMAIL CHƯA XÁC THỰC</Text>
          </View>
          <Text style={styles.bannerDesc}>
            Vui lòng mở liên kết trong email để kích hoạt đầy đủ quyền bảo mật và nhận chứng chỉ tốt nghiệp.
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
            title="Đăng nhập tài khoản"
            onPress={() => router.push('/(auth)/login')}
          />
          <Button
            title="Đăng ký tài khoản mới"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
          />
        </View>
      ) : (
        <>
          <Text style={styles.groupLabel}>QUẢN LÝ HỌC VỤ</Text>
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => router.push('/account/certificates' as const)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="ribbon-outline" size={18} color={semantic.brandPrimary} />
                </View>
                <View>
                  <Text style={styles.menuItemText}>Chứng chỉ tốt nghiệp</Text>
                  <Text style={styles.menuItemSub}>Tải tệp PDF &amp; sao chép liên kết xác thực</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.groupLabel}>BẢO MẬT &amp; ĐỒNG BỘ</Text>
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/account/profile')}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="person-circle-outline" size={18} color={semantic.textSecondary} />
                </View>
                <Text style={styles.menuItemText}>Cập nhật hồ sơ cá nhân</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/account/change-password')}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={semantic.textSecondary} />
                </View>
                <Text style={styles.menuItemText}>Đổi mật khẩu bảo mật</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => refetch()}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="refresh-outline" size={18} color={semantic.textSecondary} />
                </View>
                <Text style={styles.menuItemText}>Đồng bộ lại dữ liệu tài khoản</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.logoutWrapper}>
            <Button
              title="Đăng xuất khỏi thiết bị này"
              variant="outline"
              loading={isLoggingOut}
              onPress={handleLogout}
              style={styles.logoutBtn}
              textStyle={styles.logoutBtnText}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: semantic.surfaceCard,
    padding: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  identityOverline: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.7,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  fullNameText: {
    fontSize: 18,
    lineHeight: 23,
  },
  emailText: {
    marginTop: 2,
    color: semantic.textSecondary,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  roleBadge: {
    backgroundColor: semantic.surfaceCanvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
  },
  roleText: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
    letterSpacing: 0.6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: semantic.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.success,
    letterSpacing: 0.5,
  },
  unverifiedBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    padding: 14,
    marginTop: 14,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
    lineHeight: 18,
  },
  resendNotice: {
    fontSize: 12,
    color: semantic.brandPrimaryStrong,
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
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  authBox: {
    marginTop: 20,
    gap: 10,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: semantic.textMuted,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 2,
  },
  menuSection: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: semantic.surfaceCanvas,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  menuItemSub: {
    fontSize: 11,
    color: semantic.textMuted,
    marginTop: 2,
  },
  logoutWrapper: {
    marginTop: 22,
  },
  logoutBtn: {
    borderColor: '#FECACA',
    backgroundColor: semantic.dangerSoft,
  },
  logoutBtnText: {
    color: semantic.danger,
  },
});
