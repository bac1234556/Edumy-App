// app/(tabs)/account.tsx — Tài khoản & Bảo mật
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { confirm } from '../../src/lib/dialog';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { useSessionStore } from '../../src/store/session';
import { useLogout, useMe } from '../../src/features/auth/hooks';
import { useResendVerificationEmail } from '../../src/features/profile/hooks';
import { AppError } from '../../src/api/problem';
import { semantic, radius, monoFontFamily, layout } from '../../src/theme/tokens';

export default function AccountScreen() {
  const router = useRouter();
  const { me, status } = useSessionStore();
  const { refetch } = useMe();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { mutate: resendEmail, isPending: isResending } = useResendVerificationEmail();

  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const isLoggedIn = status === 'authenticated' && me !== null;
  const initialLetter = (me?.fullName || me?.email || 'U').trim().charAt(0).toUpperCase();

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
      <ResponsiveContainer maxWidth={layout.maxContentWidth}>
        {/* Profile Identity Card */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {isLoggedIn ? (
                <Text style={styles.avatarLetter}>{initialLetter}</Text>
              ) : (
                <Ionicons name="person-outline" size={26} color={semantic.brandPrimary} />
              )}
            </View>

            <View style={styles.profileInfo}>
              {isLoggedIn && (
                <Text style={styles.identityOverline}>ID #{me?.id}</Text>
              )}
              <Text variant="h2" style={styles.fullNameText}>
                {isLoggedIn ? me?.fullName : 'Khách vãng lai'}
              </Text>
              <Text variant="bodySmall" style={styles.emailText}>
                {isLoggedIn ? me?.email : 'Đăng nhập để đồng bộ tiến độ học và chứng chỉ'}
              </Text>
              {isLoggedIn && me?.roles && (
                <View style={styles.rolesContainer}>
                  {me.roles.map((role) => (
                    <Badge key={role} variant="info" label={role.toUpperCase()} />
                  ))}
                  {me.emailVerified && (
                    <Badge
                      variant="success"
                      label="Đã xác thực email"
                      icon={
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={13}
                          color={semantic.success}
                        />
                      }
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Email Verification Banner */}
        {isLoggedIn && me?.emailVerified === false && (
          <View style={styles.unverifiedBanner}>
            <View style={styles.bannerRow}>
              <Ionicons name="alert-circle-outline" size={18} color={semantic.warning} />
              <Text style={styles.bannerTitle}>Địa chỉ email chưa xác thực</Text>
            </View>
            <Text style={styles.bannerDesc}>
              Vui lòng mở liên kết trong email để kích hoạt đầy đủ quyền bảo mật và nhận chứng chỉ
              tốt nghiệp.
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
            <Text variant="overline" style={styles.groupLabel}>
              Học vụ
            </Text>
            <Card padded={false} style={styles.menuSection}>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemLast]}
                onPress={() => router.push('/account/certificates' as const)}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconWrap}>
                    <Ionicons name="ribbon-outline" size={18} color={semantic.brandPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemText}>Chứng chỉ tốt nghiệp</Text>
                    <Text style={styles.menuItemSub}>
                      Tải tệp PDF &amp; sao chép liên kết xác thực
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={semantic.textPlaceholder} />
              </TouchableOpacity>
            </Card>

            <Text variant="overline" style={styles.groupLabel}>
              Bảo mật &amp; Đồng bộ
            </Text>
            <Card padded={false} style={styles.menuSection}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/account/profile')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconWrap}>
                    <Ionicons
                      name="person-circle-outline"
                      size={18}
                      color={semantic.textSecondary}
                    />
                  </View>
                  <Text style={styles.menuItemText}>Cập nhật hồ sơ cá nhân</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={semantic.textPlaceholder} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/account/change-password')}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconWrap}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={semantic.textSecondary}
                    />
                  </View>
                  <Text style={styles.menuItemText}>Đổi mật khẩu bảo mật</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={semantic.textPlaceholder} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemLast]}
                onPress={() => refetch()}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconWrap}>
                    <Ionicons name="refresh-outline" size={18} color={semantic.textSecondary} />
                  </View>
                  <Text style={styles.menuItemText}>Đồng bộ lại dữ liệu tài khoản</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={semantic.textPlaceholder} />
              </TouchableOpacity>
            </Card>

            <View style={styles.logoutWrapper}>
              <Button
                title="Đăng xuất khỏi thiết bị này"
                variant="outline"
                loading={isLoggingOut}
                disabled={isLoggingOut}
                onPress={handleLogout}
                style={styles.logoutBtn}
                textStyle={styles.logoutBtnText}
              />
            </View>
          </>
        )}
      </ResponsiveContainer>
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
  profileHeaderCard: {
    padding: 18,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '700',
    color: semantic.brandPrimary,
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  identityOverline: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: semantic.textMuted,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  fullNameText: {
    fontSize: 18,
    lineHeight: 24,
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
  unverifiedBanner: {
    backgroundColor: semantic.warningSoft,
    borderWidth: 1,
    borderColor: semantic.warningBorder,
    borderRadius: radius.card,
    padding: 14,
    marginTop: 14,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: semantic.warning,
  },
  bannerDesc: {
    fontSize: 12,
    color: semantic.warning,
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
    minHeight: 40,
    borderColor: semantic.warningBorder,
  },
  resendBtnText: {
    color: semantic.warning,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  authBox: {
    marginTop: 20,
    gap: 10,
  },
  groupLabel: {
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 2,
  },
  menuSection: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: semantic.surfaceMuted,
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
    width: 36,
    height: 36,
    borderRadius: radius.btn,
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
    fontSize: 12,
    color: semantic.textMuted,
    marginTop: 2,
  },
  logoutWrapper: {
    marginTop: 22,
  },
  logoutBtn: {
    borderColor: semantic.dangerBorder,
    backgroundColor: semantic.dangerSoft,
  },
  logoutBtnText: {
    color: semantic.danger,
  },
});
