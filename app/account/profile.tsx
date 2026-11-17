// app/account/profile.tsx — Chỉnh sửa thông tin cá nhân
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
import { notify } from '../../src/lib/dialog';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, UpdateProfileFormData } from '../../src/features/profile/logic';
import { useUpdateProfile } from '../../src/features/profile/hooks';
import { useSessionStore } from '../../src/store/session';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { AppError } from '../../src/api/problem';
import { Ionicons } from '@expo/vector-icons';

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
            <Text variant="h1">Hồ sơ cá nhân</Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Cập nhật thông tin tài khoản hiển thị trên chứng chỉ và trao đổi
            </Text>
          </View>

          {serverError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Readonly Email */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Địa chỉ email</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={me?.email || ''}
                editable={false}
              />
              <Text style={styles.hintText}>Email không thể thay đổi</Text>
            </View>

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Họ và tên</Text>
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

            <Button
              title="Lưu thay đổi"
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
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 6,
    color: '#64748B',
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
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  hintText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 12,
  },
  submitBtn: {
    marginTop: 12,
  },
});
