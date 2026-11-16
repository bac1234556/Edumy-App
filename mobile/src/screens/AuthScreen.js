import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { authClient, errorMessage } from '../api/client';
import { roleHome, useAuthStore } from '../store/authStore';

export function AuthScreen({ register = false, initialEmail = '', registered = false }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const storageError = useAuthStore((s) => s.storageError);
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { email: email.trim().toLowerCase(), password };
      if (register) Object.assign(payload, { fullName: fullName.trim(), role });
      return (await authClient.post(register ? '/auth/register' : '/auth/login', payload)).data.data;
    },
    onSuccess: async (session) => {
      if (register) {
        router.replace({ pathname: '/(auth)/login', params: { registered: '1', email: email.trim() } });
      } else {
        try {
          await useAuthStore.getState().setSession(session);
        } catch {
          throw new Error('Không thể lưu phiên đăng nhập trên thiết bị. Vui lòng thử lại.');
        }
        router.replace(roleHome(session.user.role));
      }
    },
  });

  const submit = () => {
    if (mutation.isPending) return;
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Nhập email hợp lệ';
    if (password.length < 8) next.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    if (register && !fullName.trim()) next.fullName = 'Nhập họ và tên';
    setErrors(next);
    mutation.reset();
    if (Object.keys(next).length === 0) mutation.mutate();
  };
  const change = (setter) => (value) => {
    setter(value);
    setErrors({});
    mutation.reset();
  };
  const title = register ? 'Tạo tài khoản' : 'Đăng nhập';
  const message = mutation.error
    ? (mutation.error.isAxiosError ? errorMessage(mutation.error) : mutation.error.message)
    : storageError;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
          <Text variant="displaySmall" style={{ color: '#2563EB', marginBottom: 8 }}>Edumy</Text>
          <Text variant="headlineMedium">{title}</Text>
          <Text style={{ marginTop: 8, marginBottom: 24 }}>
            {register ? 'Bắt đầu hành trình học tập hoặc chia sẻ kiến thức.' : 'Tiếp tục hành trình học tập của bạn.'}
          </Text>
          {registered && <Text accessibilityRole="alert" style={{ color: '#0F766E', marginBottom: 16 }}>Đăng ký thành công. Hãy đăng nhập để tiếp tục.</Text>}
          {register && (
            <>
              <TextInput mode="outlined" label="Họ và tên" accessibilityLabel="Họ và tên" value={fullName}
                maxLength={100} onChangeText={change(setFullName)} error={!!errors.fullName} disabled={mutation.isPending} />
              <HelperText type="error" visible={!!errors.fullName}>{errors.fullName}</HelperText>
            </>
          )}
          <TextInput mode="outlined" label="Email" accessibilityLabel="Email" value={email} maxLength={150}
            onChangeText={change(setEmail)} autoCapitalize="none" keyboardType="email-address"
            autoComplete="email" error={!!errors.email} disabled={mutation.isPending} />
          <HelperText type="error" visible={!!errors.email}>{errors.email}</HelperText>
          <TextInput mode="outlined" label="Mật khẩu" accessibilityLabel="Mật khẩu" value={password}
            onChangeText={change(setPassword)} autoCapitalize="none" secureTextEntry={!visible}
            autoComplete={register ? 'new-password' : 'current-password'} error={!!errors.password}
            disabled={mutation.isPending} onSubmitEditing={submit}
            right={<TextInput.Icon icon={visible ? 'eye-off' : 'eye'} accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onPress={() => setVisible(!visible)} />} />
          <HelperText type={errors.password ? 'error' : 'info'} visible>
            {errors.password || 'Mật khẩu có ít nhất 8 ký tự'}
          </HelperText>
          {register && (
            <View style={{ marginVertical: 16 }}>
              <Text style={{ marginBottom: 8 }}>Bạn tham gia với vai trò</Text>
              <SegmentedButtons value={role} onValueChange={setRole} buttons={[
                { value: 'STUDENT', label: 'Học viên', disabled: mutation.isPending },
                { value: 'INSTRUCTOR', label: 'Giảng viên', disabled: mutation.isPending },
              ]} />
            </View>
          )}
          {message && <Text accessibilityRole="alert" style={{ color: '#B91C1C', marginVertical: 12 }}>{message}</Text>}
          <Button testID="auth-submit" mode="contained" onPress={submit} loading={mutation.isPending}
            disabled={mutation.isPending} style={{ marginTop: 12 }} contentStyle={{ paddingVertical: 6 }}>
            {title}
          </Button>
          <Button disabled={mutation.isPending} style={{ marginTop: 12 }} onPress={() => router.replace(register ? '/(auth)/login' : '/(auth)/register')}>
            {register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </Button>
          <Button disabled={mutation.isPending} onPress={() => router.replace('/(auth)')}>Về trang chào</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
