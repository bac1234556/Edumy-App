// app/(auth)/login.tsx — Đăng nhập tài khoản Edumy
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { loginSchema, LoginFormData } from '../../src/features/auth/logic';
import { useLogin } from '../../src/features/auth/hooks';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Screen } from '../../src/components/ui/Screen';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { AppError } from '../../src/api/problem';
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
          setServerError(
            `Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${appErr.retryAfterSec || 60} giây.`
          );
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
          <ResponsiveContainer maxWidth={480}>
            <TouchableOpacity
              style={styles.backToCatalog}
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              accessibilityLabel="Quay lại khám phá khóa học"
            >
              <Ionicons name="arrow-back" size={18} color={semantic.textSecondary} />
              <Text style={styles.backToCatalogText}>Khám phá khóa học</Text>
            </TouchableOpacity>

            <Card style={styles.authCard}>
              <Badge
                variant="info"
                label="Tài khoản Edumy"
                icon={<Ionicons name="school-outline" size={13} color={semantic.brandPrimary} />}
                style={styles.brandBadge}
              />

              <Text variant="h1" style={styles.title}>
                Đăng nhập
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
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Địa chỉ Email"
                      placeholder="name@edumy.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.email?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Mật khẩu"
                      labelRight={
                        <TouchableOpacity
                          onPress={() => router.push('/(auth)/forgot-password')}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                        </TouchableOpacity>
                      }
                      placeholder="Nhập mật khẩu của bạn"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.password?.message}
                      rightAdornment={
                        <TouchableOpacity
                          style={styles.eyeButton}
                          onPress={() => setShowPassword(!showPassword)}
                          accessibilityRole="button"
                          accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={semantic.textMuted}
                          />
                        </TouchableOpacity>
                      }
                    />
                  )}
                />

                <Button
                  title="Đăng nhập"
                  onPress={handleSubmit(onSubmit)}
                  loading={isPending}
                  disabled={isPending}
                  style={styles.submitButton}
                />

                <View style={styles.switchRow}>
                  <Text variant="bodySmall">Chưa có tài khoản Edumy?</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/register')}
                    hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  >
                    <Text style={styles.switchLink}>Tạo tài khoản</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </ResponsiveContainer>
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
    marginBottom: 14,
    minHeight: 44,
    paddingVertical: 8,
  },
  backToCatalogText: {
    fontSize: 13,
    fontWeight: '600',
    color: semantic.textSecondary,
  },
  authCard: {
    padding: 24,
  },
  brandBadge: {
    marginBottom: 14,
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
    borderColor: semantic.dangerBorder,
    borderRadius: radius.btn,
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
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: semantic.surfaceMuted,
  },
  switchLink: {
    color: semantic.brandPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
});
