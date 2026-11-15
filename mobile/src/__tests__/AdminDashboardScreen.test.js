import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { fetchAdminStats } from '../api/adminStats';

jest.mock('../api/adminStats', () => ({ fetchAdminStats: jest.fn() }));
jest.mock('../api/client', () => ({
  errorMessage: (error) => error.message || 'Không thể tải số liệu',
}));

const months = [
  { month: '2026-06', count: 0 },
  { month: '2026-07', count: 2 },
  { month: '2026-08', count: 0 },
  { month: '2026-09', count: 1 },
  { month: '2026-10', count: 3 },
  { month: '2026-11', count: 4 },
];
const stats = {
  usersByRole: { STUDENT: 12, INSTRUCTOR: 3, ADMIN: 1 },
  usersByStatus: { ACTIVE: 15, LOCKED: 1 },
  revenue: 1250000,
  enrollmentsLast6Months: months,
};
const clients = [];

function renderDashboard(navigation = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <AdminDashboardScreen navigation={navigation} />
    </QueryClientProvider>
  );
}

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

test('shows the loading state while stats are being fetched', () => {
  fetchAdminStats.mockReturnValue(new Promise(() => {}));
  const view = renderDashboard();
  expect(view.getByText('Đang tải dữ liệu tổng quan quản trị...')).toBeTruthy();
});

test('shows an error state with retry', async () => {
  fetchAdminStats.mockRejectedValueOnce(new Error('API tạm thời lỗi'));
  const view = renderDashboard();
  expect(await view.findByText('API tạm thời lỗi')).toBeTruthy();
  fetchAdminStats.mockResolvedValueOnce(stats);
  fireEvent.press(view.getByTestId('admin-stats-retry'));
  expect(await view.findByTestId('admin-enrollment-chart')).toBeTruthy();
});

test('renders live metrics and all six monthly bars including zero months', async () => {
  fetchAdminStats.mockResolvedValue(stats);
  const navigation = { navigate: jest.fn() };
  const view = renderDashboard(navigation);

  expect(await view.findByText('Tổng quan quản trị')).toBeTruthy();
  expect(view.getByTestId('admin-total-users')).toBeTruthy();
  expect(view.getByText('16')).toBeTruthy();
  expect(view.getByText(/1\.250\.000/)).toBeTruthy();
  expect(view.getByTestId('admin-enrollment-chart')).toBeTruthy();
  months.forEach(({ month }) => expect(view.getByTestId(`enrollment-month-${month}`)).toBeTruthy());
  expect(view.getAllByText('0').length).toBeGreaterThanOrEqual(2);

  fireEvent.press(view.getByTestId('admin-manage-users'));
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('UserManagement'));
});

test('keeps an empty-state message while rendering zero-valued chart months', async () => {
  fetchAdminStats.mockResolvedValue({
    usersByRole: { STUDENT: 0, INSTRUCTOR: 0, ADMIN: 0 },
    usersByStatus: { ACTIVE: 0, LOCKED: 0 },
    revenue: 0,
    enrollmentsLast6Months: months.map(({ month }) => ({ month, count: 0 })),
  });
  const view = renderDashboard();
  expect(await view.findByTestId('admin-stats-empty')).toBeTruthy();
  expect(view.getByTestId('admin-enrollment-chart')).toBeTruthy();
  expect(view.getAllByText('0').length).toBeGreaterThanOrEqual(6);
});
