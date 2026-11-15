import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { RoleLayout } from '../components/RoleLayout';
import { useAuthStore } from '../store/authStore';
import { Redirect, Stack, router } from 'expo-router';
import { useNotificationsStore } from '../store/notificationsStore';

jest.mock('expo-router', () => ({
  Redirect: jest.fn(() => null),
  Stack: jest.fn(() => null),
  router: { push: jest.fn() },
  useFocusEffect: (callback) => require('react').useEffect(callback, [callback]),
}));
jest.mock('../api/notifications', () => ({ refreshUnreadCount: jest.fn().mockResolvedValue(0) }));
jest.mock('../screens/ProfileScreen', () => ({ avatarSource: (url) => url }));
jest.mock('expo-secure-store', () => ({}));

test.each(['STUDENT', 'INSTRUCTOR', 'ADMIN'])('allows the correct role layout: %s', (role) => {
  useAuthStore.setState({ session: { user: { role, fullName: 'Demo' } } });
  render(<RoleLayout role={role} />);
  expect(Stack).toHaveBeenCalled();
  expect(Redirect).not.toHaveBeenCalled();
});
test('redirects a student away from the admin layout', () => {
  useAuthStore.setState({ session: { user: { role: 'STUDENT' } } });
  render(<RoleLayout role="ADMIN" />);
  expect(Redirect.mock.calls[0][0].href).toBe('/(student)');
  expect(Stack).not.toHaveBeenCalled();
});
test('logout redirects to authentication', () => {
  useAuthStore.setState({ session: null });
  render(<RoleLayout role="STUDENT" />);
  expect(Redirect.mock.calls[0][0].href).toBe('/(auth)');
});

test('shows the notification badge and opens the role-specific route', () => {
  useNotificationsStore.getState().setUnreadCount(120);
  useAuthStore.setState({ session: { user: { id: 8, role: 'ADMIN', fullName: 'Demo' } } });
  const { getByText } = render(<RoleLayout role="ADMIN" />);
  expect(getByText('99+')).toBeTruthy();
  fireEvent.press(getByText('Thông báo'));
  expect(router.push).toHaveBeenCalledWith('/(admin)/notifications');
  act(() => useNotificationsStore.getState().setUnreadCount(0));
});
