import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { api, errorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reset = () => {
    setOldPassword(''); setNewPassword(''); setConfirmation(''); setError(''); setOpen(false);
  };
  const submit = async () => {
    if (!oldPassword || newPassword.length < 8 || newPassword !== confirmation) {
      setError('Nhập mật khẩu hiện tại, mật khẩu mới ít nhất 8 ký tự và xác nhận trùng khớp.');
      return;
    }
    setBusy(true); setError('');
    const session = useAuthStore.getState().session;
    try {
      await api.put('/users/me/password', { oldPassword, newPassword });
      reset();
      if (useAuthStore.getState().session?.user.id === session?.user.id) {
        await useAuthStore.getState().clearSession();
      }
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  if (!open) return <Button onPress={() => setOpen(true)}>Đổi mật khẩu</Button>;
  return <View style={{ gap: 12 }}>
    <Text variant="titleMedium">Đổi mật khẩu</Text>
    <Text>Sau khi đổi mật khẩu, bạn cần đăng nhập lại trên các thiết bị.</Text>
    <TextInput label="Mật khẩu hiện tại" accessibilityLabel="Mật khẩu hiện tại" secureTextEntry autoCapitalize="none" value={oldPassword} onChangeText={setOldPassword} disabled={busy} maxLength={72} />
    <TextInput label="Mật khẩu mới" accessibilityLabel="Mật khẩu mới" secureTextEntry autoCapitalize="none" value={newPassword} onChangeText={setNewPassword} disabled={busy} maxLength={72} />
    <TextInput label="Xác nhận mật khẩu mới" accessibilityLabel="Xác nhận mật khẩu mới" secureTextEntry autoCapitalize="none" value={confirmation} onChangeText={setConfirmation} disabled={busy} maxLength={72} />
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
    <Button mode="contained" onPress={submit} loading={busy} disabled={busy}>Lưu mật khẩu</Button>
    <Button onPress={reset} disabled={busy}>Hủy đổi mật khẩu</Button>
  </View>;
}
