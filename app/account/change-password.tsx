// app/account/change-password.tsx — Đổi mật khẩu tài khoản
import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, ChangePasswordFormData } from '../../src/features/profile/logic';
import { useChangePassword } from '../../src/features/profile/hooks';
import { performLogout } from '../../src/features/auth/hooks';
import { notify } from '../../src/lib/dialog';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { AppError } from '../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';

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
            setError('newPassword', { message: 'Mật khẩu mới không được trùng với mật khẩu cũ' });
          } else {
            setServerError(appErr.message || 'Không thể đổi mật khẩu.');
          }
        },
      }
    );
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text variant="h1">Đổi mật khẩu</Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Cập nhật mật khẩu để bảo vệ an toàn cho tài khoản của bạn
            </Text>
          </View>

          {/* Security Notice Box */}
          <View style={styles.securityNotice}>
            <Ionicons name="information-circle-outline" size={20} color="#0284C7" />
            <Text style={styles.securityNoticeText}>
              Lưu ý: Sau khi đổi mật khẩu thành công, toàn bộ phiên đăng nhập trên app và trình duyệt web sẽ bị thu hồi và bạn cần đăng nhập lại.
            </Text>
          </View>

          {serverError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Mật khẩu hiện tại</Text>
              <View style={styles.passwordWrapper}>
                <Controller
                  control={control}
                  name="currentPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput, Boolean(errors.currentPassword) && styles.inputError]}
                      placeholder="Nhập mật khẩu đang dùng"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
              {errors.currentPassword && (
                <Text style={styles.fieldError}>{errors.currentPassword.message}</Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Mật khẩu mới</Text>
              <View style={styles.passwordWrapper}>
                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput, Boolean(errors.newPassword) && styles.inputError]}
                      placeholder="Ít nhất 8 ký tự, gồm chữ và số"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text style={styles.fieldError}>{errors.newPassword.message}</Text>
              )}
            </View>

            {/* Confirm New Password */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Xác nhận mật khẩu mới</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, Boolean(errors.confirmPassword) && styles.inputError]}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.confirmPassword && (
                <Text style={styles.fieldError}>{errors.confirmPassword.message}</Text>
              )}
            </View>

            <Button
              title="Đổi mật khẩu"
              onPress={handleSubmit(onSubmit)}
              loading={isPending}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 6,
    color: '#64748B',
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  securityNoticeText: {
    color: '#0369A1',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#ffffff',
    color: '#0F172A',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    height: 48,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 12,
  },
  submitBtn: {
    marginTop: 12,
  },
});
