import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { router } from 'expo-router';
import MockAdapter from 'axios-mock-adapter';
import * as SecureStore from 'expo-secure-store';
import { AuthScreen } from '../screens/AuthScreen';
import { authClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));
const mock = new MockAdapter(authClient);
const clients = [];

function screen(props = {}) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><PaperProvider theme={{ ...MD3LightTheme, animation: { scale: 0 } }}><AuthScreen {...props} /></PaperProvider></QueryClientProvider>);
}
function fill(view, password = 'Password123!') {
  fireEvent.changeText(view.getByLabelText('Email'), 'student@example.com');
  fireEvent.changeText(view.getByLabelText('Mật khẩu'), password);
}

beforeEach(() => {
  jest.useFakeTimers();
  mock.reset();
  useAuthStore.setState({ session: null, hydrated: true, storageError: null });
  SecureStore.setItemAsync.mockResolvedValue(undefined);
  SecureStore.deleteItemAsync.mockResolvedValue(undefined);
});
afterAll(() => mock.restore());
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  act(() => { jest.runOnlyPendingTimers(); });
  jest.useRealTimers();
});

test('empty and short-password forms show validation without calling the server', async () => {
  const view = screen();
  fireEvent.press(view.getByTestId('auth-submit'));
  expect(view.getByText('Nhập email hợp lệ')).toBeTruthy();
  fill(view, 'short');
  fireEvent.press(view.getByTestId('auth-submit'));
  expect(view.getByText('Mật khẩu phải có ít nhất 8 ký tự')).toBeTruthy();
  expect(mock.history.post).toHaveLength(0);
});

test.each([
  ['STUDENT', '/(student)'], ['INSTRUCTOR', '/(instructor)'], ['ADMIN', '/(admin)'],
])('login saves credentials and routes %s correctly', async (role, expectedRoute) => {
  const session = { accessToken: 'access', refreshToken: 'refresh', user: { id: 1, role } };
  mock.onPost('/auth/login').reply(200, { data: session });
  const view = screen(); fill(view);
  fireEvent.press(view.getByTestId('auth-submit'));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith(expectedRoute));
  expect(useAuthStore.getState().session).toEqual(session);
  expect(SecureStore.setItemAsync).toHaveBeenCalled();
});

test('register sends the selected role, then opens login with confirmation', async () => {
  mock.onPost('/auth/register').reply(201, { data: {} });
  const view = screen({ register: true }); fill(view);
  fireEvent.changeText(view.getByLabelText('Họ và tên'), 'Giảng viên mới');
  fireEvent.press(view.getByText('Giảng viên'));
  fireEvent.press(view.getByTestId('auth-submit'));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith({
    pathname: '/(auth)/login', params: { email: 'student@example.com', registered: '1' },
  }));
  expect(JSON.parse(mock.history.post[0].data).role).toBe('INSTRUCTOR');
  expect(useAuthStore.getState().session).toBeNull();
});

test.each([
  [false, 401, 'Email hoặc mật khẩu không đúng'], [true, 409, 'Email đã được sử dụng'],
])('renders server errors for login/register', async (register, status, message) => {
  mock.onPost(register ? '/auth/register' : '/auth/login').reply(status, { success: false, message });
  const view = screen({ register }); fill(view);
  if (register) fireEvent.changeText(view.getByLabelText('Họ và tên'), 'Học viên');
  fireEvent.press(view.getByTestId('auth-submit'));
  await waitFor(() => expect(view.getByText(message)).toBeTruthy());
  expect(router.replace).not.toHaveBeenCalled();
});

test('a failed secure write shows an actionable error and does not navigate', async () => {
  SecureStore.setItemAsync.mockRejectedValue(new Error('storage unavailable'));
  mock.onPost('/auth/login').reply(200, { data: {
    accessToken: 'access', refreshToken: 'refresh', user: { id: 1, role: 'STUDENT' },
  } });
  const view = screen(); fill(view);
  fireEvent.press(view.getByTestId('auth-submit'));
  await waitFor(() => expect(view.getByText('Không thể lưu phiên đăng nhập trên thiết bị. Vui lòng thử lại.')).toBeTruthy());
  expect(router.replace).not.toHaveBeenCalled();
});
