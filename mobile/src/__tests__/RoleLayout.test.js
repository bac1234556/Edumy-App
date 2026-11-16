import React from 'react';
import { render } from '@testing-library/react-native';
import { RoleLayout } from '../components/RoleLayout';
import { useAuthStore } from '../store/authStore';
import { Redirect, Stack } from 'expo-router';

jest.mock('expo-router', () => ({ Redirect: jest.fn(() => null), Stack: jest.fn(() => null), router: { push: jest.fn() } }));
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
