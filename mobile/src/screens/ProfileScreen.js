import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Image } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { api, errorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';

export const avatarSource = (url) => url?.startsWith('/')
  ? `${api.defaults.baseURL.replace(/\/api(?:\/v1)?$/, '')}${url}` : url;

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.session?.user);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setProfile((await api.get('/users/me')).data.data); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const chooseAvatar = async () => {
    setError('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setError('Vui lòng cho phép truy cập ảnh.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });
      if (result.canceled) return;
      setBusy(true);
      const asset = result.assets[0];
      const form = new FormData();
      form.append('file', { uri: asset.uri, name: asset.fileName || 'avatar.jpg', type: asset.mimeType || 'image/jpeg' });
      const { data } = await api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile((p) => ({ ...p, avatarUrl: data.data.avatarUrl }));
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  const save = async () => {
    if (!profile.fullName?.trim()) { setError('Vui lòng nhập họ tên.'); return; }
    setBusy(true); setError(''); setMessage('');
    const id = user?.id;
    try {
      const { data } = await api.put('/users/me', {
        fullName: profile.fullName.trim(), bio: profile.bio || '', avatarUrl: profile.avatarUrl || '',
      });
      const store = useAuthStore.getState();
      if (store.session?.user.id === id) await store.setSession({ ...store.session, user: data.data });
      setProfile(data.data); setEditing(false); setMessage('Đã cập nhật hồ sơ.');
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
    <Text variant="headlineMedium">Hồ sơ cá nhân</Text>
    {loading ? <ActivityIndicator accessibilityLabel="Đang tải hồ sơ" /> : <>
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
      {!!message && <Text>{message}</Text>}
      {!profile ? <><Text>Chưa có thông tin hồ sơ.</Text><Button onPress={load}>Thử lại</Button></> : <>
        {!!profile.avatarUrl && <Image accessibilityLabel="Ảnh đại diện" source={{ uri: avatarSource(profile.avatarUrl) }} style={{ width: 96, height: 96, borderRadius: 48 }} />}
        <Text>{profile.email}</Text>
        {editing ? <>
          <TextInput label="Họ tên" accessibilityLabel="Họ tên" value={profile.fullName} maxLength={100} disabled={busy} onChangeText={(fullName) => setProfile((p) => ({ ...p, fullName }))} />
          <TextInput label="Giới thiệu" accessibilityLabel="Giới thiệu" value={profile.bio || ''} maxLength={2000} multiline disabled={busy} onChangeText={(bio) => setProfile((p) => ({ ...p, bio }))} />
          <Button disabled={busy} onPress={chooseAvatar}>Chọn ảnh đại diện</Button>
          <Button mode="contained" loading={busy} disabled={busy} onPress={save}>Lưu hồ sơ</Button>
          <Button disabled={busy} onPress={() => { setEditing(false); load(); }}>Hủy</Button>
        </> : <>
          <Text>{profile.fullName}</Text><Text>{profile.bio || 'Chưa có giới thiệu.'}</Text>
          <Button onPress={() => { setEditing(true); setMessage(''); }}>Chỉnh sửa hồ sơ</Button>
        </>}
      </>}
    </>}
  </ScrollView>;
}
