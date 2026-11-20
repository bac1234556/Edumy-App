// app/(auth)/register.tsx — Đăng ký tài khoản Edumy
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
import { registerSchema, RegisterFormData } from '../../src/features/auth/logic';
import { useRegister } from '../../src/features/auth/hooks';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Screen } from '../../src/components/ui/Screen';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { AppError } from '../../src/api/problem';
import { semantic, radius } from '../../src/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const { mutate: registerUser, isPending } = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null);
    registerUser(data, {
      onSuccess: () => {
        router.replace('/(tabs)');
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        if (appErr.code === 'EMAIL_ALREADY_REGISTERED' || appErr.message?.includes('already in use')) {
          setError('email', { message: 'Email này đã được đăng ký trước đó.' });
        } else {
          setServerError(appErr.message || 'Đăng ký tài khoản không thành công.');
        }

        if (appErr.fieldErrors) {
          for (const [f, msg] of Object.entries(appErr.fieldErrors)) {
            setError(f as keyof RegisterFormData, { message: msg });
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
              style={styles.backToLogin}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Quay lại đăng nhập"
            >
              <Ionicons name="arrow-back" size={18} color={semantic.textSecondary} />
              <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
            </TouchableOpacity>

            <Card style={styles.authCard}>
              <Badge
                variant="info"
                label="Tài khoản mới"
                icon={<Ionicons name="person-add-outline" size={13} color={semantic.brandPrimary} />}
                style={styles.brandBadge}
              />

              <Text variant="h1" style={styles.title}>
                Tạo tài khoản Edumy
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                Một tài khoản duy nhất để truy cập kho khóa học, phòng học và chứng chỉ số.
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
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Họ và tên đầy đủ"
                      placeholder="Nguyễn Văn A"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.fullName?.message}
                    />
                  )}
                />

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
                      label="Mật khẩu (tối thiểu 8 ký tự, chữ & số)"
                      placeholder="Tạo mật khẩu an toàn"
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
                  title="Hoàn tất đăng ký"
                  onPress={handleSubmit(onSubmit)}
                  loading={isPending}
                  disabled={isPending}
                  style={styles.submitButton}
                />

                <View style={styles.switchRow}>
                  <Text variant="bodySmall">Đã có tài khoản Edumy?</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/login')}
                    hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  >
                    <Text style={styles.switchLink}>Đăng nhập</Text>
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
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
    minHeight: 44,
    paddingVertical: 8,
  },
  backToLoginText: {
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
    gap: 15,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
