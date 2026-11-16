// app/(auth)/forgot-password.tsx
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
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../src/features/auth/logic';
import { useForgotPassword } from '../../src/features/auth/hooks';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { Ionicons } from '@expo/vector-icons';

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
        // Always show success message to prevent user enumeration (flow 5 of rules 30)
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text variant="h1">Quên mật khẩu</Text>
            <Text variant="body" style={styles.subtitle}>
              Nhập email đăng ký của bạn để nhận liên kết đặt lại mật khẩu
            </Text>
          </View>

          {submitted ? (
            <View style={styles.successBox}>
              <Ionicons name="mail-unread-outline" size={48} color="#0D9488" />
              <Text variant="h3" style={styles.successTitle}>
                Kiểm tra hòm thư của bạn
              </Text>
              <Text variant="body" style={styles.successDescription}>
                Nếu email của bạn tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư. Vui lòng mở liên kết trong email trên trình duyệt web để tiến hành đổi mật khẩu.
              </Text>
              <Button
                title="Quay lại đăng nhập"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.backToLoginButton}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text variant="label">Email đã đăng ký</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, Boolean(errors.email) && styles.inputError]}
                      placeholder="example@edumy.com"
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

              <Button
                title="Gửi hướng dẫn đặt lại"
                onPress={handleSubmit(onSubmit)}
                loading={isPending}
                style={styles.submitButton}
              />
            </View>
          )}
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
    padding: 24,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 28,
  },
  subtitle: {
    marginTop: 6,
    color: '#64748B',
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
  inputError: {
    borderColor: '#EF4444',
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  successBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  successDescription: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    color: '#475569',
  },
  backToLoginButton: {
    marginTop: 24,
    width: '100%',
  },
});
