// app/account/profile.tsx — Chỉnh sửa thông tin cá nhân
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { notify } from '../../src/lib/dialog';
import { updateProfileSchema, UpdateProfileFormData } from '../../src/features/profile/logic';
import { useUpdateProfile } from '../../src/features/profile/hooks';
import { useSessionStore } from '../../src/store/session';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { AppError } from '../../src/api/problem';
import { layout, radius, semantic } from '../../src/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { me } = useSessionStore();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: me?.fullName || '',
    },
  });

  const onSubmit = (data: UpdateProfileFormData) => {
    setServerError(null);
    updateProfile(data.fullName, {
      onSuccess: async () => {
        await notify('Thành công', 'Thông tin hồ sơ đã được cập nhật.');
        router.back();
      },
      onError: (err) => {
        const appErr = err as unknown as AppError;
        setServerError(appErr.message || 'Không thể cập nhật hồ sơ.');
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Hồ sơ cá nhân', headerBackTitle: 'Quay lại' }} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer maxWidth={layout.maxReadingWidth}>
          <Card>
            <View style={styles.header}>
              <Text variant="h2">Thông tin cá nhân</Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                Cập nhật tên hiển thị trên chứng chỉ và trao đổi học tập.
              </Text>
            </View>

            {serverError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={20} color={semantic.danger} />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Input
                label="Địa chỉ email"
                value={me?.email || ''}
                editable={false}
                helperText="Email không thể thay đổi"
              />

              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Họ và tên"
                    placeholder="Nguyễn Văn A"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.fullName?.message}
                  />
                )}
              />

              <Button
                title="Lưu thay đổi"
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
    marginBottom: 18,
  },
  subtitle: {
    marginTop: 4,
    color: semantic.textSecondary,
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
  submitBtn: {
    marginTop: 4,
  },
});
