import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { fetchAdminUsers, updateAdminUserStatus } from '../api/adminManagement';
import { UserManagementScreen } from '../screens/UserManagementScreen';
import { useAuthStore } from '../store/authStore';

jest.mock('../api/adminManagement', () => ({
  fetchAdminUsers: jest.fn(),
  updateAdminUserStatus: jest.fn(),
  fetchAdminCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
}));
jest.mock('../api/client', () => ({
  errorMessage: (error) => error.response?.data?.message || error.message || 'Lỗi kết nối',
}));

const user = {
  id: 3,
  fullName: 'Nguyễn Văn A',
  email: 'user@example.com',
  role: 'STUDENT',
  status: 'ACTIVE',
};

const page = (content) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
  last: true,
});

beforeEach(() => {
  useAuthStore.setState({ session: { user: { id: 99, role: 'ADMIN' } } });
  fetchAdminUsers.mockReset().mockResolvedValue(page([user]));
  updateAdminUserStatus.mockReset();
});

test('loads users from the paginated admin API', async () => {
  const screen = render(<UserManagementScreen />);

  expect(await screen.findByText('Nguyễn Văn A')).toBeTruthy();
  expect(fetchAdminUsers).toHaveBeenCalledWith({
    page: 0,
    size: 20,
    sort: 'createdAt,desc',
  });
  expect(screen.getByText('Tìm thấy 1 tài khoản')).toBeTruthy();
});

test('searches and filters users through the API', async () => {
  const screen = render(<UserManagementScreen />);
  await screen.findByText('Nguyễn Văn A');
  fireEvent.changeText(screen.getByLabelText('Tìm kiếm người dùng'), 'nguyen');

  await waitFor(() => {
    expect(fetchAdminUsers).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      sort: 'createdAt,desc',
      keyword: 'nguyen',
    });
  });

  fireEvent.press(screen.getAllByText('Học viên')[0]);
  await waitFor(() => {
    expect(fetchAdminUsers).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      sort: 'createdAt,desc',
      keyword: 'nguyen',
      role: 'STUDENT',
    });
  });
});

test('updates account status and prevents locking the current admin', async () => {
  updateAdminUserStatus.mockResolvedValue({ ...user, status: 'LOCKED' });
  const screen = render(<UserManagementScreen />);
  await screen.findByText('Nguyễn Văn A');

  fireEvent(screen.getByLabelText('Khóa tài khoản user@example.com'), 'valueChange', false);
  await waitFor(() => expect(updateAdminUserStatus).toHaveBeenCalledWith(user.id, 'LOCKED'));
  expect(await screen.findByText('Đã khóa')).toBeTruthy();

  const adminUser = { ...user, id: 99, email: 'admin@example.com', role: 'ADMIN' };
  fetchAdminUsers.mockResolvedValue(page([adminUser]));
  fireEvent.press(screen.getByText('Quản trị viên'));
  const adminSwitch = await screen.findByLabelText('Khóa tài khoản admin@example.com');
  expect(adminSwitch.props.disabled).toBe(true);
});

test('loads additional pages when the user reaches the end of the list', async () => {
  const firstPage = Array.from({ length: 20 }, (_, index) => ({ ...user, id: index + 1 }));
  fetchAdminUsers
    .mockResolvedValueOnce({ ...page(firstPage), totalElements: 21, totalPages: 2, last: false })
    .mockResolvedValueOnce({
      ...page([{ ...user, id: 21, fullName: 'Nguyễn Văn B' }]),
      page: 1,
      totalElements: 21,
      totalPages: 2,
      last: true,
    });
  const screen = render(<UserManagementScreen />);
  expect((await screen.findAllByText('Nguyễn Văn A')).length).toBeGreaterThan(0);

  await act(async () => {
    await screen.getByTestId('users-list').props.onEndReached();
  });
  expect(fetchAdminUsers).toHaveBeenCalledTimes(2);
  expect(fetchAdminUsers).toHaveBeenLastCalledWith({
    page: 1,
    size: 20,
    sort: 'createdAt,desc',
  });
});

test('shows empty and error states', async () => {
  fetchAdminUsers.mockResolvedValueOnce(page([]));
  const emptyScreen = render(<UserManagementScreen />);
  expect(await emptyScreen.findByText('Không tìm thấy tài khoản nào')).toBeTruthy();
  emptyScreen.unmount();

  fetchAdminUsers.mockRejectedValueOnce(new Error('Network error'));
  const errorScreen = render(<UserManagementScreen />);
  expect(await errorScreen.findByText('Không tải được danh sách người dùng')).toBeTruthy();
  expect(errorScreen.getByText('Network error')).toBeTruthy();
});
