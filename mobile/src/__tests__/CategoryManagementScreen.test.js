import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  createCategory,
  fetchAdminCategories,
  updateCategory,
} from '../api/adminManagement';
import { CategoryManagementScreen } from '../screens/CategoryManagementScreen';

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

beforeEach(() => {
  jest.clearAllMocks();
  fetchAdminCategories.mockResolvedValue([]);
});

test('loads categories and creates a new category', async () => {
  createCategory.mockResolvedValue({
    id: 5,
    name: 'Thiết kế',
    slug: 'thiet-ke',
    courseCount: 0,
  });
  const screen = render(<CategoryManagementScreen />);
  expect(await screen.findByText('Chưa có danh mục nào')).toBeTruthy();

  fireEvent.press(screen.getByText('+ Thêm danh mục'));
  fireEvent.changeText(screen.getByLabelText('Tên danh mục'), 'Thiết kế');
  fireEvent.press(screen.getByText('Lưu'));

  await waitFor(() => {
    expect(createCategory).toHaveBeenCalledWith({
      name: 'Thiết kế',
      slug: null,
      icon: null,
      description: null,
      parentId: null,
    });
  });
  expect(await screen.findByText('thiet-ke')).toBeTruthy();
});

test('edits an existing category', async () => {
  const category = { id: 8, name: 'Lập trình', slug: 'lap-trinh', courseCount: 2, parentId: 2 };
  fetchAdminCategories.mockResolvedValue([category]);
  updateCategory.mockResolvedValue({ ...category, name: 'Lập trình nâng cao' });
  const screen = render(<CategoryManagementScreen />);
  await screen.findByText('Lập trình');

  fireEvent.press(screen.getByLabelText('Chỉnh sửa Lập trình'));
  fireEvent.changeText(screen.getByLabelText('Tên danh mục'), 'Lập trình nâng cao');
  fireEvent.press(screen.getByText('Lưu'));

  await waitFor(() => {
    expect(updateCategory).toHaveBeenCalledWith(8, {
      name: 'Lập trình nâng cao',
      slug: 'lap-trinh',
      icon: null,
      description: null,
      parentId: 2,
    });
  });
  expect(await screen.findByText('Lập trình nâng cao')).toBeTruthy();
});

test('shows loading and error states', async () => {
  let resolveCategories;
  fetchAdminCategories.mockReturnValueOnce(new Promise((resolve) => {
    resolveCategories = resolve;
  }));
  const loadingScreen = render(<CategoryManagementScreen />);
  expect(loadingScreen.getByText('Đang tải danh mục...')).toBeTruthy();
  resolveCategories([]);
  expect(await loadingScreen.findByText('Chưa có danh mục nào')).toBeTruthy();
  loadingScreen.unmount();

  fetchAdminCategories.mockRejectedValueOnce(new Error('Network error'));
  const errorScreen = render(<CategoryManagementScreen />);
  expect(await errorScreen.findByText('Không tải được danh mục')).toBeTruthy();
  expect(errorScreen.getByText('Network error')).toBeTruthy();
});
