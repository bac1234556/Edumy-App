// app/(auth)/forgot-password.tsx — Quên mật khẩu
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
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../src/features/auth/logic';
import { useForgotPassword } from '../../src/features/auth/hooks';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Screen } from '../../src/components/ui/Screen';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { radius, semantic } from '../../src/theme/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data.email, {
      onSettled: () => {
        // Always show success message to prevent user enumeration
        setSubmitted(true);
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
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
            >
              <Ionicons name="arrow-back" size={20} color={semantic.textSecondary} />
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>

            <Card style={styles.authCard}>
              <View style={styles.header}>
                <Text variant="h1">Quên mật khẩu</Text>
                <Text variant="bodySmall" style={styles.subtitle}>
                  Nhập email đăng ký của bạn để nhận liên kết đặt lại mật khẩu.
                </Text>
              </View>

              {submitted ? (
                <View style={styles.successBox}>
                  <View style={styles.successIconWrap}>
                    <Ionicons
                      name="mail-unread-outline"
                      size={30}
                      color={semantic.brandPrimary}
                    />
                  </View>
                  <Text variant="h3" style={styles.successTitle}>
                    Kiểm tra hòm thư của bạn
                  </Text>
                  <Text variant="bodySmall" style={styles.successDescription}>
                    Nếu email của bạn tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi
                    đến hộp thư. Vui lòng mở liên kết trong email trên trình duyệt web để tiến hành
                    đổi mật khẩu.
                  </Text>
                  <Button
                    title="Quay lại đăng nhập"
                    onPress={() => router.replace('/(auth)/login')}
                    style={styles.backToLoginButton}
                  />
                </View>
              ) : (
                <View style={styles.form}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Email đã đăng ký"
                        placeholder="example@edumy.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.email?.message}
                      />
                    )}
                  />

                  <Button
                    title="Gửi hướng dẫn đặt lại"
                    onPress={handleSubmit(onSubmit)}
                    loading={isPending}
                    disabled={isPending}
                    style={styles.submitButton}
                  />
                </View>
              )}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
    minHeight: 44,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: semantic.textSecondary,
  },
  authCard: {
    padding: 24,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 6,
    color: semantic.textSecondary,
  },
  form: {
    gap: 16,
  },
  submitButton: {
    marginTop: 4,
  },
  successBox: {
    alignItems: 'center',
    paddingTop: 8,
  },
  successIconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.card,
    backgroundColor: semantic.brandSoft,
    borderWidth: 1,
    borderColor: semantic.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    marginTop: 14,
    textAlign: 'center',
  },
  successDescription: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    color: semantic.textSecondary,
  },
  backToLoginButton: {
    marginTop: 22,
    width: '100%',
  },
});
