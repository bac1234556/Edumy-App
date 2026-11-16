import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../screens/ProfileScreen';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

jest.mock('../api/client', () => ({ api: { get: jest.fn(), put: jest.fn(), defaults: { baseURL: 'http://localhost:8080/api' } }, errorMessage: () => 'Lỗi kết nối' }));
jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn().mockResolvedValue(), deleteItemAsync: jest.fn() }));

jest.mock('react-native-paper', () => {
  const ReactNative = require('react-native');
  const React = require('react');
  const Paper = jest.requireActual('react-native-paper');

  const TextInput = React.forwardRef(({ label, ...props }, ref) => (
    <ReactNative.TextInput
      ref={ref}
      accessibilityLabel={props.accessibilityLabel || label}
      {...props}
    />
  ));
  TextInput.displayName = 'TestTextInput';

  return { ...Paper, TextInput };
});
const user = { id: 1, fullName: 'Original', email: 'student@edumy.com', role: 'STUDENT', bio: '' };
beforeEach(() => {
  useAuthStore.setState({ session: { accessToken: 'a', refreshToken: 'r', user }, hydrated: true });
  api.get.mockResolvedValue({ data: { data: user } });
});
test('loads, edits and publishes the updated profile to shared session', async () => {
  api.put.mockResolvedValue({ data: { data: { ...user, fullName: 'New Name', bio: 'Hello' } } });
  const screen = render(<ProfileScreen />);
  await screen.findByText('Original');
  fireEvent.press(screen.getByText('Chỉnh sửa hồ sơ'));
  fireEvent.changeText(screen.getByLabelText('Họ tên'), 'New Name');
  fireEvent.changeText(screen.getByLabelText('Giới thiệu'), 'Hello');
  fireEvent.press(screen.getByText('Lưu hồ sơ'));
  await screen.findByText('Đã cập nhật hồ sơ.');
  expect(api.put).toHaveBeenCalledWith('/users/me', { fullName: 'New Name', bio: 'Hello', avatarUrl: '' });
  expect(useAuthStore.getState().session.user.fullName).toBe('New Name');
});
test('failed load provides a retry and recovers', async () => {
  api.get.mockRejectedValueOnce(new Error('offline'));
  const screen = render(<ProfileScreen />);
  await screen.findByText('Lỗi kết nối');
  fireEvent.press(screen.getByText('Thử lại'));
  await waitFor(() => expect(screen.getByText('Original')).toBeTruthy());
});

test('changes password and clears this device session only after success', async () => {
  api.put.mockResolvedValue({ data: { success: true } });
  const screen = render(<ProfileScreen />);
  await screen.findByText('Original');
  fireEvent.press(screen.getByText('Đổi mật khẩu'));
  fireEvent.changeText(screen.getByLabelText('Mật khẩu hiện tại'), 'Password123!');
  fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), 'NewPassword456!');
  fireEvent.changeText(screen.getByLabelText('Xác nhận mật khẩu mới'), 'NewPassword456!');
  fireEvent.press(screen.getByText('Lưu mật khẩu'));
  await waitFor(() => expect(useAuthStore.getState().session).toBeNull());
  expect(api.put).toHaveBeenCalledWith('/users/me/password', {
    oldPassword: 'Password123!', newPassword: 'NewPassword456!',
  });
});

test('password failure preserves the session and allows retry', async () => {
  api.put.mockRejectedValueOnce(new Error('offline'));
  const screen = render(<ProfileScreen />);
  await screen.findByText('Original');
  fireEvent.press(screen.getByText('Đổi mật khẩu'));
  fireEvent.changeText(screen.getByLabelText('Mật khẩu hiện tại'), 'Password123!');
  fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), 'NewPassword456!');
  fireEvent.changeText(screen.getByLabelText('Xác nhận mật khẩu mới'), 'NewPassword456!');
  fireEvent.press(screen.getByText('Lưu mật khẩu'));
  await screen.findByText('Lỗi kết nối');
  expect(useAuthStore.getState().session).not.toBeNull();
});
