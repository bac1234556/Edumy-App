// app/(auth)/login.tsx — Đăng nhập tài khoản Edumy (Swiss Editorial Auth)
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../../src/features/auth/logic';
import { useLogin } from '../../src/features/auth/hooks';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { AppError } from '../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';
import { semantic, radius } from '../../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setServerError(null);
    login(data, {
      onSuccess: () => {
        router.replace('/(tabs)');
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        if (appErr.code === 'AUTH_INVALID_CREDENTIALS') {
          setServerError('Email hoặc mật khẩu không chính xác.');
        } else if (appErr.code === 'AUTH_ACCOUNT_LOCKED') {
          setServerError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
        } else if (appErr.code === 'AUTH_LOGIN_TEMPORARILY_BLOCKED') {
          setServerError(`Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${appErr.retryAfterSec || 60} giây.`);
        } else {
          setServerError(appErr.message || 'Đăng nhập không thành công.');
        }

        if (appErr.fieldErrors) {
          for (const [f, msg] of Object.entries(appErr.fieldErrors)) {
            setError(f as keyof LoginFormData, { message: msg });
          }
        }
      },
    });
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backToCatalog}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="arrow-back" size={18} color={semantic.textSecondary} />
            <Text style={styles.backToCatalogText}>Khám phá khóa học</Text>
          </TouchableOpacity>

          <View style={styles.authCard}>
            <View style={styles.brandBadge}>
              <View style={styles.brandDot} />
              <Text style={styles.brandBadgeText}>EDUMY IDENTITY // MOBILE AUTH</Text>
            </View>

            <Text variant="h1" style={styles.title}>
              Đăng nhập hệ thống
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Sử dụng tài khoản Edumy chung trên cả ứng dụng di động và website.
            </Text>

            {serverError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color={semantic.danger} />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            )}

            <View style={styles.form}>
              {/* Email field */}
              <View style={styles.fieldGroup}>
                <Text variant="label">Địa chỉ Email</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, Boolean(errors.email) && styles.inputError]}
                      placeholder="name@edumy.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.email && (
                  <Text style={styles.fieldError}>{errors.email.message}</Text>
                )}
              </View>

              {/* Password field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text variant="label">Mật khẩu</Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                    <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordWrapper}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, styles.passwordInput, Boolean(errors.password) && styles.inputError]}
                        placeholder="Nhập mật khẩu của bạn"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={semantic.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.fieldError}>{errors.password.message}</Text>
                )}
              </View>

              <Button
                title="Đăng nhập"
                onPress={handleSubmit(onSubmit)}
                loading={isPending}
                style={styles.submitButton}
              />

              <View style={styles.switchRow}>
                <Text variant="bodySmall">Chưa có tài khoản Edumy?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Text style={styles.switchLink}>Tạo tài khoản</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  backToCatalog: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 6,
  },
  backToCatalogText: {
    fontSize: 13,
    fontWeight: '600',
    color: semantic.textSecondary,
  },
  authCard: {
    backgroundColor: semantic.surfaceCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: semantic.borderSubtle,
    padding: 22,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 14,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.brandPrimary,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.brandPrimaryStrong,
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 23,
    lineHeight: 29,
  },
  subtitle: {
    marginTop: 6,
    color: semantic.textSecondary,
    marginBottom: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    color: semantic.danger,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    height: 46,
    backgroundColor: semantic.surfaceCanvas,
    borderWidth: 1,
    borderColor: semantic.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 14,
    color: semantic.textPrimary,
  },
  inputError: {
    borderColor: semantic.danger,
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
    padding: 4,
  },
  fieldError: {
    color: semantic.danger,
    fontSize: 12,
    marginTop: 2,
  },
  forgotPasswordText: {
    color: semantic.brandPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchLink: {
    color: semantic.brandPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
});
