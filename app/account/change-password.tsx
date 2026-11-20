// app/account/change-password.tsx — Đổi mật khẩu tài khoản
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { changePasswordSchema, ChangePasswordFormData } from '../../src/features/profile/logic';
import { useChangePassword } from '../../src/features/profile/hooks';
import { performLogout } from '../../src/features/auth/hooks';
import { notify } from '../../src/lib/dialog';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { AppError } from '../../src/api/problem';
import { layout, radius, semantic } from '../../src/theme/tokens';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: changePassword, isPending } = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    setServerError(null);
    changePassword(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: async () => {
          await notify('Đã đổi mật khẩu', 'Vui lòng đăng nhập lại trên mọi thiết bị.');
          await performLogout(queryClient, (href) => router.replace(href));
        },
        onError: (err) => {
          const appErr = err as unknown as AppError;
          if (
            appErr.code === 'CURRENT_PASSWORD_INCORRECT' ||
            appErr.code === 'PASSWORD_INCORRECT'
          ) {
            setError('currentPassword', {
              message: appErr.message || 'Mật khẩu hiện tại không chính xác',
            });
          } else if (appErr.code === 'PASSWORD_SAME_AS_OLD') {
            setError('newPassword', {
              message: 'Mật khẩu mới không được trùng với mật khẩu cũ',
            });
          } else {
            setServerError(appErr.message || 'Không thể đổi mật khẩu.');
          }
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Đổi mật khẩu', headerBackTitle: 'Quay lại' }} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer maxWidth={layout.maxReadingWidth}>
          <Card>
            <View style={styles.header}>
              <Text variant="h2">Cập nhật mật khẩu</Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                Bảo vệ an toàn cho tài khoản học tập và giảng dạy của bạn.
              </Text>
            </View>

            {/* Security Notice Box */}
            <View style={styles.securityNotice}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={semantic.brandPrimary}
              />
              <Text style={styles.securityNoticeText}>
                Lưu ý: Sau khi đổi mật khẩu thành công, toàn bộ phiên đăng nhập trên app và trình
                duyệt web sẽ bị thu hồi và bạn cần đăng nhập lại.
              </Text>
            </View>

            {serverError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={20} color={semantic.danger} />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Mật khẩu hiện tại"
                    placeholder="Nhập mật khẩu đang dùng"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.currentPassword?.message}
                    rightAdornment={
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showCurrentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'
                        }
                      >
                        <Ionicons
                          name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={semantic.textMuted}
                        />
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Mật khẩu mới"
                    placeholder="Ít nhất 8 ký tự, gồm chữ và số"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.newPassword?.message}
                    rightAdornment={
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'
                        }
                      >
                        <Ionicons
                          name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={semantic.textMuted}
                        />
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Xác nhận mật khẩu mới"
                    placeholder="Nhập lại mật khẩu mới"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />

              <Button
                title="Đổi mật khẩu"
                onPress={handleSubmit(onSubmit)}
                loading={isPending}
                disabled={isPending}
                style={styles.submitBtn}
              />
            </View>
          </Card>
        </ResponsiveContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: semantic.surfaceCanvas,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 4,
    color: semantic.textSecondary,
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    borderRadius: radius.btn,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  securityNoticeText: {
    color: semantic.brandPrimaryStrong,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.dangerSoft,
    borderWidth: 1,
    borderColor: semantic.dangerBorder,
    padding: 12,
    borderRadius: radius.btn,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    color: semantic.danger,
    fontSize: 13,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    marginTop: 4,
  },
});
