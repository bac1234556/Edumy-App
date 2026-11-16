// app/(auth)/register.tsx — Đăng ký tài khoản Edumy (Swiss Editorial Auth)
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
import { registerSchema, RegisterFormData } from '../../src/features/auth/logic';
import { useRegister } from '../../src/features/auth/hooks';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { AppError } from '../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';
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
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color={semantic.textSecondary} />
            <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>

          <View style={styles.authCard}>
            <View style={styles.brandBadge}>
              <View style={styles.brandDot} />
              <Text style={styles.brandBadgeText}>EDUMY IDENTITY // NEW ACCOUNT</Text>
            </View>

            <Text variant="h1" style={styles.title}>
              Khởi tạo tài khoản
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
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text variant="label">Họ và tên đầy đủ</Text>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, Boolean(errors.fullName) && styles.inputError]}
                      placeholder="Nguyễn Văn A"
                      placeholderTextColor="#94A3B8"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.fullName && (
                  <Text style={styles.fieldError}>{errors.fullName.message}</Text>
                )}
              </View>

              {/* Email */}
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

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text variant="label">Mật khẩu (tối thiểu 8 ký tự, chữ &amp; số)</Text>
                <View style={styles.passwordWrapper}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, styles.passwordInput, Boolean(errors.password) && styles.inputError]}
                        placeholder="Tạo mật khẩu an toàn"
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
                title="Hoàn tất đăng ký"
                onPress={handleSubmit(onSubmit)}
                loading={isPending}
                style={styles.submitButton}
              />

              <View style={styles.switchRow}>
                <Text variant="bodySmall">Đã có tài khoản Edumy?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.switchLink}>Đăng nhập</Text>
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
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 6,
  },
  backToLoginText: {
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
    gap: 15,
  },
  fieldGroup: {
    gap: 6,
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
